const Master = require('../models/master.model');
const Application = require('../models/application.model');
const db = require('../config/db.config');

const getMasterData = async (req, res) => {
  try {
    let religions = [];
    try {
      religions = await Master.getAllReligions();
    } catch (err) {
      console.warn('[getMasterData] religion_master:', err.message);
      const [rows] = await db.query(
        'SELECT DISTINCT religion AS religion_name FROM student_master WHERE religion IS NOT NULL AND religion <> "" ORDER BY religion'
      );
      religions = rows.map((r, idx) => ({ id: idx + 1, religion_name: r.religion_name }));
    }

    const [communities, districts] = await Promise.all([
      Master.getAllCommunities(),
      Master.getAllDistricts()
    ]);

    // Build hierarchical structure: Religion -> Communities -> Castes
    const religionCommunityCasteMap = {};
    for (const religion of religions) {
      let communitiesForReligion = [];
      let castesForReligion = [];
      try {
        communitiesForReligion = await Master.getCommunityByReligion(religion.id);
      } catch (err) {
        console.warn(`[getMasterData] community_master for religion ${religion.id}:`, err.message);
      }
      try {
        castesForReligion = await Master.getCasteByReligion(religion.id);
      } catch (err) {
        console.warn(`[getMasterData] caste_master for religion ${religion.id}:`, err.message);
      }
      religionCommunityCasteMap[religion.id] = {
        religionId: religion.id,
        religionName: religion.religion_name,
        communities: [],
        castes: []
      };
      const casteSeen = new Set();
      for (const caste of castesForReligion) {
        const key = String(caste.caste_name || '').trim().toLowerCase();
        if (!key || casteSeen.has(key)) continue;
        casteSeen.add(key);
        religionCommunityCasteMap[religion.id].castes.push({
          casteId: caste.id,
          casteName: caste.caste_name
        });
      }
      
      for (const community of communitiesForReligion) {
        const castesForCommunity = await Master.getCasteByReligionAndCommunity(religion.id, community.id);
        const castes = castesForCommunity.map(c => ({ casteId: c.id, casteName: c.caste_name }));
        religionCommunityCasteMap[religion.id].communities.push({
          communityId: community.id,
          communityName: community.community_name,
          castes
        });
      }
    }

    // Fetch other dynamic lookups from student_master/institution_master if needed
    // For now, mirroring the logic from app.js but using real masters for community/district
    const [[genderRows], [boardRows], [occupationRows], [insTypeRows], [cityRows]] =
      await Promise.all([
        db.query('SELECT DISTINCT gender FROM student_master WHERE gender IS NOT NULL ORDER BY gender'),
        db.query('SELECT DISTINCT last_institution_board FROM student_master WHERE last_institution_board IS NOT NULL ORDER BY last_institution_board'),
        db.query('SELECT DISTINCT parent_occupation FROM student_master WHERE parent_occupation IS NOT NULL ORDER BY parent_occupation'),
        db.query('SELECT DISTINCT ins_type FROM institution_master WHERE ins_type IS NOT NULL ORDER BY ins_type'),
        db.query('SELECT DISTINCT ins_city FROM institution_master WHERE ins_city IS NOT NULL AND LENGTH(ins_city) BETWEEN 3 AND 25 ORDER BY ins_city'),
      ]);

    const orderedMerge = (dbVals, standards) => {
      const seen = new Set();
      const out = [];
      const push = (value) => {
        const v = String(value || '').trim();
        const key = v.toLowerCase();
        if (!v || seen.has(key)) return;
        seen.add(key);
        out.push(v);
      };

      standards.forEach(push);
      dbVals.forEach(push);
      return out;
    };

    let communityFees = [];
    try {
      communityFees = await Master.getAllFees();
    } catch (e) {
      console.warn('[getMasterData] fees_master:', e.message);
    }
    const envFee = Number(process.env.DEFAULT_APPLICATION_FEE || process.env.APPLICATION_FEE || 500);
    const defaultApplicationFee = Number.isFinite(envFee) && envFee >= 0 ? Math.round(envFee) : 500;

    res.json({
      success: true,
      // Hierarchical Religion -> Community -> Caste mapping
      religionHierarchy: religionCommunityCasteMap,
      religions: religions.map(r => ({ id: r.id, name: r.religion_name })),
      communities, // From community_master
      districts,   // From district_master (with states)
      communityFees,
      defaultApplicationFee,
      religion:          religions.map(r => r.religion_name),
      gender:            orderedMerge(genderRows.map(r => r.gender),            ['Male', 'Female', 'Transgender']),
      qualifyingBoard:   orderedMerge(boardRows.map(r => r.last_institution_board), ['State Board', 'CBSE', 'ICSE', 'ITI', 'Others']),
      parentOccupation:  orderedMerge(occupationRows.map(r => r.parent_occupation), ['Farmer', 'Business', 'Govt Employee', 'Private Employee', 'Daily Wages', 'Others']),
      insType:           insTypeRows.map(r => r.ins_type),
      cities:            cityRows.map(r => r.ins_city),
      motherTongue:      ['Tamil', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Hindi', 'Urdu', 'Others'],
      mediumOfInstruction: ['Tamil', 'English', 'Urdu', 'Others'],
      admissionType:     ['First Year', 'Lateral Entry', 'Part Time'],
      hscExamType:       ['Regular', 'Private', 'Improvement'],
      hscMajorStream:    ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Arts'],
      nativity:          ['Tamil Nadu', 'Other State'],
      cbseSubjects:      ['English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'],
      icseSubjects:      ['English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Science'],
      stateBoardSubjects:['Tamil', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology'],
      itiSubjects:       ['Trade Practical', 'Trade Theory', 'Work Shop', 'Drawing', 'Social'],
      vocationalSubjects:['Language', 'English', 'Maths', 'Theory', 'Practical-I', 'Practical-II'],
      otherSubjects:     ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5', 'Subject 6'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching master data' });
  }
};

const getCollegeList = async (req, res) => {
  try {
    const { search = '', city = '', type = '' } = req.query;
    const colleges = await Application.getCollegeList({ search, city, type });
    res.json({ success: true, colleges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching college list' });
  }
};

module.exports = { getMasterData, getCollegeList };
