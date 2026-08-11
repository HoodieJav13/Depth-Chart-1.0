# Firebase coach access and shared-chart setup

The app uses Firebase Authentication to verify a phone number, then Cloud Firestore to approve that coach and store the shared depth chart.

## One-time Firebase console setup

1. Open the Firebase project `depth-chart-1d8be`.
2. Under **Authentication > Sign-in method**, enable **Phone**.
3. Under **Authentication > Settings > SMS region policy**, allow the United States.
4. Confirm `eldorado-depth-chart.vercel.app` is listed under **Authorized domains**.
5. Create a Cloud Firestore database in production mode if one does not exist.
6. Create this document:

   - Collection: `approvedCoaches`
   - Document ID: `+15057307634`
   - Field `active`: boolean `true`
   - Field `displayName`: string `Coach Chavez`

7. Publish the repository's `firestore.rules` in **Firestore Database > Rules**. The same rules can also be deployed with:

```bash
firebase deploy --only firestore:rules --project depth-chart-1d8be
```

## Shared document locations

The app creates these documents automatically after setup:

```text
teams/eldorado-freshman/depthChart/current
teams/eldorado-freshman/snapshots/{snapshotId}
```

Do not manually create the current depth-chart document unless recovering data. On the first approved login, the app transactionally creates it. If the original browser contains meaningful local assignments or added players, they are imported once. If another coach already created the shared chart, local data never overwrites it automatically.

## Adding another coach

Create another document in `approvedCoaches` whose document ID is that coach's complete E.164 phone number, such as `+15055550134`. Set `active` to `true` and provide the display name that should appear in the app.

Setting `active` to `false` or deleting the document removes access without another app deployment.

## Security model

- The client cannot create, list, update, or delete approval records.
- A signed-in user can only read the approval document matching the phone number in the Firebase ID token.
- Team chart and snapshot documents are readable and writable only by active approved coaches.
- Shared writes compare the stored revision in a Firestore transaction before saving, preventing silent lost updates.
- Undo refuses to run after a newer remote revision exists.

## First production test

1. Sign in with the approved phone number.
2. Confirm the shared chart opens and the header reports `Saved`.
3. Move one player on one device.
4. Open the app on a second device and verify the change appears.
5. Create and restore a test snapshot.
6. Print or save the active formation as PDF and confirm the output uses a white background.