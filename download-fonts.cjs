const { download } = require('google-fonts-helper');

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Dancing+Script:wght@600;700&display=swap';

async function main() {
  const downloader = download(FONTS_URL, {
    base64: false,
    overwriting: true,
    outputDir: './public/fonts',
    stylePath: 'fonts.css',
    fontsDir: '.',
    fontsPath: '/fonts',
  });

  downloader.hook('download:start', () => console.log('Telechargement des polices en cours...'));
  downloader.hook('download-font:done', (font) => console.log('  OK', font.filename));
  downloader.hook('download:complete', () => console.log('Termine ! Fichiers dans public/fonts/'));

  await downloader.execute();
}

main().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
