
const BASE_URL = 'http://localhost:3000/api/auth';

async function testRegistration() {
    const uniqueId = Date.now();
    const payload = {
        nama: `Test Owner ${uniqueId}`,
        email: `testowner${uniqueId}@example.com`,
        password: 'password123',
        nama_toko: `Toko Test ${uniqueId}`
    };

    try {
        const regRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const regData = await regRes.json();

        if (regData.token && regData.user && regData.user.role === 'owner') {
            console.log('VERIFICATION_SUCCESS');
        } else {
            console.log('VERIFICATION_FAILURE', JSON.stringify(regData));
        }

    } catch (error) {
        console.error('VERIFICATION_ERROR', error);
    }
}

testRegistration();
