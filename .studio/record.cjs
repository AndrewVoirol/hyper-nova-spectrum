const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--enable-unsafe-webgpu', '--no-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: '.studio/tmp/recordings/',
      size: { width: 1920, height: 1080 }
    }
  });

  const video_start_epoch_ms = Date.now();
  
  const page = await context.newPage();
  
  // Navigate to dev server
  await page.goto('http://localhost:3000/');
  
  // Inject and execute script
  const scriptContent = fs.readFileSync(path.join(__dirname, 'capture_script.js'), 'utf8');
  await page.addScriptTag({ content: scriptContent });
  
  // Wait for completion
  await page.waitForFunction(() => window.__studio_capture_complete === true, { timeout: 60000 });
  
  // Retrieve markers
  const markers = await page.evaluate(() => window.__studio_markers);
  
  // Ensure video is saved
  await page.close();
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  
  // Move video and write timeline
  fs.renameSync(videoPath, path.join(__dirname, 'raw_screencast.webm'));
  
  fs.writeFileSync(path.join(__dirname, 'capture_timeline.json'), JSON.stringify({
    video_start_epoch_ms,
    markers
  }, null, 2));
  
  console.log("Capture complete");
})();
