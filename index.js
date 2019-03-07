const request = require('request-promise');

const cheerio = require('cheerio');

const base = "https://www.aopa.org";
const url = "https://www.aopa.org/go-fly/aircraft-and-ownership/aircraft-fact-sheets";
const linkPre = `"/go-fly/aircraft-and-ownership/aircraft-fact-sheets/`;

//main
(async () => {
    try {
        console.log("Scraping!");

        //grab data
        let holder = await request({
            uri: url,
            headers: {
                'User-Agent': 'Request-Promise'
            }
        });

        //extract links
        let links = [];
        let start = 0;
        let end = 0;
        while (holder.indexOf(linkPre, start) != -1) {
            //find start of phrase
            start = holder.indexOf(linkPre, start);
            //find end of phrase
            end = holder.indexOf(`"`, start + 1);
            links.push(holder.substring(start + 1, end));
            start = end;
        }

        //extract tables from each link
        let tables = await Promise.all(links.map(async (href) => {
            try {
                let req = await request({
                    uri: base + href,
                    headers: {
                        'User-Agent': 'Request-Promise'
                    }
                });

                //get element
                let $ = cheerio.load(req);
                let table = $('table.default');
                let tables = [];

                //get headings
                table.find('th').each((i, th) => {
                    tables.push($(th).text());
                })

                table.children('tr').each((x, tr) => {
                    tr.children().length
                });


                //return (table) ? (tabletojson.convert(table)) : null;
                return (table) ? tables : null;
            } catch (err) {
                return (err);
            }
        }));
        console.log(tables);
    } catch (err) {
        return err;
    }
})();