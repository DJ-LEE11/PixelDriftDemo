# TikTok Mini Game local debug

1. In Cocos Creator, build the project with the **Douyin Microgame** target.
2. Set the output directory to `build/tiktok-native-base`.
3. Prepare the TikTok package:

   ```sh
   TIKTOK_CLIENT_KEY='<client-key>' node scripts/adapt-tiktok.mjs
   ```

4. Start TikTok DevTool from the generated package directory:

   ```sh
   cd build/tiktok-mini-game
   ttmg dev --client-key '<client-key>'
   ```

The exported directory is generated content and remains excluded by `.gitignore`.
Do not commit account cookies, Client Secret, or other reusable credentials.
