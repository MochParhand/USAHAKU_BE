const axios = require('axios');

async function test() {
    const baseUrl = 'http://localhost:3000/api';

    try {
        // 1. Login user 1 (Owner A)
        const loginA = await axios.post(`${baseUrl}/auth/login`, {
            email: 'citalaksana@gmail.com', // Replace with known email from check-data
            password: 'password123' // I hope this is the password
        });
        const tokenA = loginA.data.token;
        const shopA = loginA.data.user.shop_id;

        // 2. Login user 2 (Owner B)
        // Need to find another owner email
        const loginB = await axios.post(`${baseUrl}/auth/login`, {
            email: 'user_ciya_email@example.com', // Replace with ciya's email
            password: 'password123'
        });
        const tokenB = loginB.data.token;
        const shopB = loginB.data.user.shop_id;

        console.log(`User A (Shop ${shopA}) Token acquired.`);
        console.log(`User B (Shop ${shopB}) Token acquired.`);

        // 3. Get Products for A
        const prodA = await axios.get(`${baseUrl}/products`, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        console.log(`User A Products Count: ${prodA.data.length}`);

        // 4. Get Products for B
        const prodB = await axios.get(`${baseUrl}/products`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        console.log(`User B Products Count: ${prodB.data.length}`);

        if (JSON.stringify(prodA.data) === JSON.stringify(prodB.data) && prodA.data.length > 0) {
            console.error('FAIL: Both owners see identical products!');
        } else {
            console.log('SUCCESS: Owners see different products.');
        }

    } catch (e) {
        console.error('Test Error:', e.response?.data || e.message);
    }
}

test();
