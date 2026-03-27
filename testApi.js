require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/reports'; // Assuming port 5000 based on common patterns
const EMAIL = 'adalrizvi157@gmail.com';
const PASSWORD = 'password'; // I need to know the password or have a token

async function testApi() {
    try {
        // First login to get token
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: EMAIL,
            password: 'password' // Assuming a common password or the user knows it
        });
        const token = loginRes.data.token;
        console.log('Logged in successfully');

        const reportsRes = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (reportsRes.data && reportsRes.data.length > 0) {
            console.log('First report data:', JSON.stringify(reportsRes.data[0], null, 2));
            if (reportsRes.data[0].planType) {
                console.log('SUCCESS: planType found:', reportsRes.data[0].planType);
            } else {
                console.log('FAILURE: planType NOT found in response');
            }
        } else {
            console.log('No reports found');
        }
    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) console.error('Response data:', error.response.data);
    }
}

testApi();
