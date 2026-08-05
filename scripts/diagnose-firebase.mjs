const targets = [
  ["hosting-init", "https://depth-chart-1d8be.web.app/__/firebase/init.json"],
  [
    "auth-public-config",
    "https://identitytoolkit.googleapis.com/v1/projects?key=AIzaSyDXwsb3V0PjXbU9sR9cvllmXFZ7IaMpomY",
  ],
];

for (const [name, url] of targets) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log(`[firebase-diagnostic:${name}] status=${response.status}`);
    console.log(text.slice(0, 12000));
  } catch (error) {
    console.log(`[firebase-diagnostic:${name}] failed`);
    console.log(error instanceof Error ? error.message : String(error));
  }
}
