const jwt = require('jsonwebtoken');

async function testEndpoints() {
  const token = jwt.sign({ id: '281d2fe5-56cd-4458-9d30-fbffb02d46a1', role: 'STUDENT' }, 'supersecretkey'); // dummy token
  
  try {
    console.log('1. Testing /task/:id');
    const res1 = await fetch('https://lgs-technlogies-prototype.onrender.com/api/internships/task/c2bf8fca-24cf-4fba-aa0b-5888aa630701', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ driveLink: 'https://linkedin.com/valid' })
    });
    console.log('Task Status:', res1.status, await res1.text());

    console.log('2. Testing /progress/:id');
    const res2 = await fetch('https://lgs-technlogies-prototype.onrender.com/api/internships/progress/c2bf8fca-24cf-4fba-aa0b-5888aa630701', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ progressStr: '["mod1"]' })
    });
    console.log('Progress Status:', res2.status, await res2.text());

    console.log('3. Testing /mock-complete/:id');
    const res3 = await fetch('https://lgs-technlogies-prototype.onrender.com/api/internships/mock-complete/c2bf8fca-24cf-4fba-aa0b-5888aa630701', {
      method: 'POST'
    });
    console.log('Mock Complete Status:', res3.status, await res3.text());

  } catch (e) {
    console.error(e);
  }
}

testEndpoints();
