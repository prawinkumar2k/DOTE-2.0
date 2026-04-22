const Master = require('../models/master.model');
const Application = require('../models/application.model');
const db = require('../config/db.config');

const getMasterData = async (req, res) => {
  try {
    const [communities, districts] = await Promise.all([
      Master.getAllCommunities(),
      Master.getAllDistricts()
    ]);

    // Fetch other dynamic lookups from student_master/institution_master if needed
    // For now, mirroring the logic from app.js but using real masters for community/district
    const [[religionRows], [genderRows], [boardRows], [occupationRows], [insTypeRows], [cityRows]] =
      await Promise.all([
        db.query('SELECT DISTINCT religion FROM student_master WHERE religion IS NOT NULL ORDER BY religion'),
        db.query('SELECT DISTINCT gender FROM student_master WHERE gender IS NOT NULL ORDER BY gender'),
        db.query('SELECT DISTINCT last_institution_board FROM student_master WHERE last_institution_board IS NOT NULL ORDER BY last_institution_board'),
        db.query('SELECT DISTINCT parent_occupation FROM student_master WHERE parent_occupation IS NOT NULL ORDER BY parent_occupation'),
        db.query('SELECT DISTINCT ins_type FROM institution_master WHERE ins_type IS NOT NULL ORDER BY ins_type'),
        db.query('SELECT DISTINCT ins_city FROM institution_master WHERE ins_city IS NOT NULL AND LENGTH(ins_city) BETWEEN 3 AND 25 ORDER BY ins_city'),
      ]);

    const merge = (dbVals, standards) => [...new Set([...dbVals, ...standards])].sort();

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
      communities, // From community_master
      districts,   // From district_master (with states)
      communityFees,
      defaultApplicationFee,
      religion:          merge(religionRows.map(r => r.religion),               ['Hindu', 'Christian', 'Muslim', 'Others']),
      gender:            merge(genderRows.map(r => r.gender),                   ['Male', 'Female', 'Transgender']),
      qualifyingBoard:   merge(boardRows.map(r => r.last_institution_board),    ['State Board', 'CBSE', 'ICSE', 'ITI', 'Others']),
      parentOccupation:  merge(occupationRows.map(r => r.parent_occupation),    ['Farmer', 'Business', 'Govt Employee', 'Private Employee', 'Daily Wages', 'Others']),
      insType:           insTypeRows.map(r => r.ins_type),
      cities:            cityRows.map(r => r.ins_city),
      motherTongue:      ['Tamil', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Hindi', 'Urdu', 'Others'],
      mediumOfInstruction: ['Tamil', 'English', 'Urdu', 'Others'],
      admissionType:     ['First Year', 'Lateral-1[12]', 'Lateral-2[ITI]', 'Part Time'],
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
