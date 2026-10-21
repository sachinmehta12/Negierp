import bcrypt from 'bcryptjs';
import { sequelize, User, Stream, Subject, InstituteSettings } from './models';

async function hash(pw: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

export async function seedDatabase() {
  console.log('--- Initializing NEGI TUTORIALS MySQL Database with Sequelize ORM ---');

  try {
    await sequelize.authenticate();
    console.log('  [OK] Connected to MySQL Database');

    await sequelize.sync({ alter: true });
    console.log('  [OK] Synced Sequelize Models (Tables verified/created in MySQL)');

    const defaultPasswordHash = await hash('Password123');

    // 1. Institute Owner (Master Administrator)
    let owner = await User.findOne({ where: { username: 'owner' } });
    if (!owner) {
      owner = await User.create({
        username: 'owner',
        email: 'owner@negitutorials.com',
        passwordHash: defaultPasswordHash,
        role: 'owner',
        isActive: true
      });
      console.log('  [OK] Initialized Institute Owner: owner / Password123');
    }

    // 2. Administrator Mentor (Faculty)
    let mentor = await User.findOne({ where: { username: 'mentor' } });
    if (!mentor) {
      mentor = await User.create({
        username: 'mentor',
        email: 'mentor@negitutorials.com',
        passwordHash: defaultPasswordHash,
        role: 'mentor',
        isActive: true,
        designation: 'Head Faculty & Senior Mentor'
      });
      console.log('  [OK] Initialized Administrator Mentor: mentor / Password123');
    }

    // 3. Academic Streams
    const streamsData = [
      {
        name: 'Science (PCM)',
        code: 'PCM',
        applicableClasses: '11,12',
        description: 'Physics, Chemistry, and Mathematics curriculum geared for Engineering & JEE.'
      },
      {
        name: 'Science (PCB)',
        code: 'PCB',
        applicableClasses: '11,12',
        description: 'Physics, Chemistry, and Biology curriculum geared for Medical & NEET.'
      },
      {
        name: 'Commerce',
        code: 'COMM',
        applicableClasses: '11,12',
        description: 'Accountancy, Business Studies, Economics, and Applied Mathematics for CA & CUET.'
      },
      {
        name: 'Humanities / Arts',
        code: 'ARTS',
        applicableClasses: '11,12',
        description: 'History, Political Science, Geography, Economics, and English Core.'
      }
    ];

    const streamMap: Record<string, any> = {};
    for (const s of streamsData) {
      let existing = await Stream.findOne({ where: { code: s.code } });
      if (!existing) {
        existing = await Stream.create(s);
      }
      streamMap[s.code] = existing;
    }
    console.log('  [OK] Initialized Academic Streams');

    // 4. Standard Subject Catalog
    const subjectsData = [
      // Class 10
      { name: 'Class 10 Mathematics', code: 'MATH-10', targetClass: 10, streamId: null, monthlyFee: 1400.0, description: 'Standard and Basic NCERT Math coaching.' },
      { name: 'Class 10 Science', code: 'SCI-10', targetClass: 10, streamId: null, monthlyFee: 1400.0, description: 'Physics, Chemistry and Biology comprehensive coaching.' },
      { name: 'Class 10 Social Science', code: 'SST-10', targetClass: 10, streamId: null, monthlyFee: 1200.0, description: 'History, Civics, Geography and Economics.' },
      { name: 'Class 10 English', code: 'ENG-10', targetClass: 10, streamId: null, monthlyFee: 1000.0, description: 'First Flight and Footprints without Feet.' },

      // Class 11
      { name: 'Class 11 Physics', code: 'PHYS-11', targetClass: 11, streamId: null, monthlyFee: 1800.0, description: 'Mechanics, Waves, Thermodynamics & NCERT + Entrance.' },
      { name: 'Class 11 Chemistry', code: 'CHEM-11', targetClass: 11, streamId: null, monthlyFee: 1800.0, description: 'Physical, Organic and Inorganic Chemistry.' },
      { name: 'Class 11 Mathematics', code: 'MATH-11', targetClass: 11, streamId: streamMap['PCM']?.get('id'), monthlyFee: 1800.0, description: 'Calculus, Trigonometry, Coordinate Geometry.' },
      { name: 'Class 11 Biology', code: 'BIO-11', targetClass: 11, streamId: streamMap['PCB']?.get('id'), monthlyFee: 1800.0, description: 'Cell Biology, Plant & Animal Physiology.' },
      { name: 'Class 11 Accountancy', code: 'ACC-11', targetClass: 11, streamId: streamMap['COMM']?.get('id'), monthlyFee: 1600.0, description: 'Financial Accounting principles & Ledger.' },
      { name: 'Class 11 Economics', code: 'ECON-11', targetClass: 11, streamId: streamMap['COMM']?.get('id'), monthlyFee: 1500.0, description: 'Microeconomics and Statistics for Economics.' },

      // Class 12
      { name: 'Class 12 Physics', code: 'PHYS-12', targetClass: 12, streamId: null, monthlyFee: 2000.0, description: 'Electrostatics, Magnetism, Optics, Modern Physics.' },
      { name: 'Class 12 Chemistry', code: 'CHEM-12', targetClass: 12, streamId: null, monthlyFee: 2000.0, description: 'Organic Mechanisms, Coordination Compounds, Solutions.' },
      { name: 'Class 12 Mathematics', code: 'MATH-12', targetClass: 12, streamId: streamMap['PCM']?.get('id'), monthlyFee: 2000.0, description: 'Relations, Functions, Integrals, Vectors & 3D Geometry.' },
      { name: 'Class 12 Biology', code: 'BIO-12', targetClass: 12, streamId: streamMap['PCB']?.get('id'), monthlyFee: 2000.0, description: 'Genetics, Evolution, Ecology & Biotechnology.' },
      { name: 'Class 12 Accountancy', code: 'ACC-12', targetClass: 12, streamId: streamMap['COMM']?.get('id'), monthlyFee: 1800.0, description: 'Partnership Firms, Company Accounts & Cash Flow.' },
      { name: 'Class 12 Economics', code: 'ECON-12', targetClass: 12, streamId: streamMap['COMM']?.get('id'), monthlyFee: 1800.0, description: 'Macroeconomics and Indian Economic Development.' }
    ];

    for (const sub of subjectsData) {
      let existing = await Subject.findOne({ where: { code: sub.code } });
      if (!existing) {
        await Subject.create(sub);
      }
    }
    console.log('  [OK] Initialized Subject Catalog');

    // 5. Institute Settings Defaults
    const settingsCount = await InstituteSettings.count();
    if (settingsCount === 0) {
      await InstituteSettings.create({
        name: 'NEGI TUTORIALS',
        tagline: 'Learn • Grow • Succeed',
        phone: '+91 98765 43210',
        email: 'contact@negitutorials.com',
        address: 'Plot 12, Sector 4, Main Road, New Delhi, India'
      });
      console.log('  [OK] Initialized Institute Settings');
    }

    console.log('--- Database Initialization Complete (Initial Zero State: 0 students, 0 fees, 0 attendance, 0 exams) ---');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
