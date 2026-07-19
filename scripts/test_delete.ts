async function testDelete() {
  try {
    const res = await fetch('http://localhost:5000/api/admin/registrations');
    const data = await res.json();
    if (data.length > 0) {
      console.log('Trying to delete registration:', data[0].id);
      const delRes = await fetch(`http://localhost:5000/api/admin/registrations/${data[0].id}`, {
        method: 'DELETE'
      });
      console.log('Status:', delRes.status);
      const delData = await delRes.text();
      console.log('Response:', delData);
    } else {
      console.log('No registrations found.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
testDelete();
