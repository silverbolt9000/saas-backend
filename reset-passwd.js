const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

async function reset() {
    await mongoose.connect('mongodb+srv://radamesterhorst:8DzSNPKeWoAYpo90@cluster0.k04ui.mongodb.net/saas_dev?retryWrites=true&w=majority&appName=Cluster0');

    const hash = await bcrypt.hash('123456', 10);

    await mongoose.connection
        .collection('users')
        .updateOne(
            { email: 'admin@test.com' },
            { $set: { passwordHash: hash } },
        );

    console.log('Senha resetada para 123456');
    process.exit(0);
}

reset();
