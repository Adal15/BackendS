const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = 'seoanalyzer_secret_12345';
const API_URL = 'http://localhost:10001/api/admin/upgrade-history';

async function check() {
    const token = jwt.sign({ isAdmin: true, email: 'admin@jts.com' }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Using Token:', token);

    try {
        const res = await axios.get(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

check();
