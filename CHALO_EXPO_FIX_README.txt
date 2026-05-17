CHALO EXPO BUILD FIX

Use this fixed file as your root app config:

1. Delete or rename the old app.config.ts / app.config(1).ts.
2. Put the provided config file in your project root.
3. Rename it exactly to:

   app.config.js

4. Keep expo-image-manipulator installed in package.json if your app code imports it.
   Do NOT add expo-image-manipulator inside the plugins array.
5. Do NOT add expo-task-manager inside the plugins array either.
   It can remain installed as a dependency.
6. Commit the change to GitHub.
7. Rebuild with:

   eas build --platform android --profile preview

Main fix:
- app.config.ts was using TypeScript syntax that your EAS config reader was failing to parse.
- expo-image-manipulator was listed as a config plugin, but it is not a valid config plugin.
- expo-task-manager also does not need to be listed as a config plugin.
