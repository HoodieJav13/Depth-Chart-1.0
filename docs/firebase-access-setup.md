# Firebase coach access setup

The app uses Firebase Authentication to verify a phone number, then Cloud Firestore to decide whether that verified number is an active coach.

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

## Adding another coach

Create another document in `approvedCoaches` whose document ID is that coach's complete E.164 phone number, such as `+15055550134`. Set `active` to `true` and provide the display name that should appear in the app.

Setting `active` to `false` or deleting the document removes access without another app deployment.

## Security model

The client cannot create, list, update, or delete approval records. A signed-in user can only read the approval document matching the phone number in their Firebase ID token. Future shared depth-chart documents under `depthCharts` are readable and writable only when an active approval document exists.
