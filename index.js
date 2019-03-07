const request = require('request-promise');

const cheerio = require('cheerio');

const json2csv = require('json2csv').parse;

const fs = require('fs');

const base = "https://www.aopa.org";
const url = "https://www.aopa.org/go-fly/aircraft-and-ownership/aircraft-fact-sheets";
const linkPre = `"/go-fly/aircraft-and-ownership/aircraft-fact-sheets/`;

//main
async function main () {
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
        let extract = await Promise.all(links.map(async (href, i) => {
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
                let models = table.find('th').length;

                //get headings
                table.find('th').each((i, th) => {
                    tables.push({ name: $(th).text() });
                })

                let c = 0;
                table.find('tr').each((x, tr) => {
                    if (x != 0) {
                        let field = "";
                        $(tr).children().each((j, td) => {
                            if (c >= models)
                                c = 0;

                            if (j == 0) {
                                field = $(td).text();
                            }

                            tables[c][field] = $(td).text();
                            c++;
                        });
                    }
                });
                return tables;
            } catch (err) {
                return (err);
            }
        }));
         //write to json
         await fs.writeFile("database.json", JSON.stringify(extract), (err, data) => {
            if(err) console.log(err);

            console.log("JSON Write was successful!");
        });

        let csv = ""
        for(let i = 0; i < extract.length; i++) {
            for(let j = 0; j < extract[i].length; j++) {
                csv+=json2csv((extract[i][j]), { fields: Object.keys(extract[i][j]) });
            }
        }
        console.log(csv);
        /*
        let csv = extract.reduce((acc, ex) => {
            console.log("reducing!");
            //turn to csv
            acc += json2csv(ex, { fields: Object.keys(ex[0]) });
            return acc;
        });

        /*
        await extract.forEach((ex) => {
            console.log("reducing!");
            csv += json2csv(ex, { fields: Object.keys(ex[0]) });
            console.log(csv);
        });
        console.log(csv);*/

        //write to file
        await fs.writeFile("database.csv", csv, (err, data) => {
            if(err) console.log(err);

            console.log("Write was successful!");
        });

    } catch (err) {
        return err;
    }
}

main();