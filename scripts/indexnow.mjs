// Avisa o Bing (e os outros motores do IndexNow: Yandex, Seznam, Naver) de que
// as páginas do site mudaram, para serem lidas logo em vez de esperarem pela
// próxima visita do robô. Corre depois de cada deploy com páginas novas:
//
//   node scripts/indexnow.mjs            → envia todas as páginas do sitemap
//   node scripts/indexnow.mjs /matematica/12-ano/numeros-complexos   → só estas
//
// A chave tem de estar publicada em https://matematica.top/f33e392afc19ad04262510e38d5a7397.txt
// (é o ficheiro public/f33e392afc19ad04262510e38d5a7397.txt).
const KEY = 'f33e392afc19ad04262510e38d5a7397';
const HOST = 'matematica.top';

const args = process.argv.slice(2);
let urls;
if (args.length) {
  urls = args.map((p) => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`);
} else {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`${urls.length} páginas enviadas → ${res.status} ${res.statusText}`);
