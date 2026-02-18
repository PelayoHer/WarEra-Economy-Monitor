const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9pZCI6IjY4MTNiNzcwZWZlY2RmOWJhYjE5NmJhYSJ9LCJpYXQiOjE3NzAyMDQ2NjMsImV4cCI6MTc3Mjc5NjY2M30.eUPUFX7DFrz7Xr7zNDbzdafss-FZuJdzgq6Ib0YUxCg';
const fingerprint = '4578fb52c7ad5811b524b1564f19e480';
const userId = '6813b770efecdf9bab196baa'; // From token

async function tryProcedure(procName, input) {
    return new Promise((resolve) => {
        const encodedInput = encodeURIComponent(JSON.stringify({ "0": input }));
        const url = `https://api2.warera.io/trpc/${procName}?batch=1&input=${encodedInput}`;

        const options = {
            headers: {
                'authorization': `Bearer ${token}`,
                'x-fingerprint': fingerprint,
                'content-type': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`[SUCCESS] ${procName}:`, data.substring(0, 500));
                } else {
                    console.log(`[FAIL] ${procName}: ${res.statusCode}`);
                    if (res.statusCode === 500 || res.statusCode === 400) {
                        // print error
                        console.log('Error 500/400');
                    }
                }
                resolve(true);
            });
        }).on('error', (e) => {
            console.error(`[ERROR] ${procName}:`, e.message);
            resolve(false);
        });
    });
}

(async () => {
    console.log(`Testing worker.getWorkers for userId "${userId}"...`);
    await tryProcedure('worker.getWorkers', { userId: userId });
})();
