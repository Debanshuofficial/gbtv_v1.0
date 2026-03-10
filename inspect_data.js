const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBEEdaawV_WYCyebwSebB-n4eOWPMs2LQgPO8ncdOPh4dejAcNz0XGTqJlhBX1Qx2hB_3aXDJ4S4Yo/pub?gid=0&single=true&output=csv';

https.get(url, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        const lines = data.split('\n');
        console.log('Headers:', lines[0]);
        console.log('First Row:', lines[1]);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
