/* eslint-disable tailwindcss/classnames-order */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Check, Upload, User, MapPin,
  Briefcase, GraduationCap, ClipboardList, Award, School, FileCheck, Loader, Trash2, Percent, LogOut, Eye, RefreshCw, X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { generateApplicationPDF } from '../../utils/ApplicationPDF';

const steps = [
  { id: 1, title: 'Personal Details', icon: <User size={18} /> },
  { id: 2, title: 'Contact Info', icon: <MapPin size={18} /> },
  { id: 3, title: 'Parent Details', icon: <Briefcase size={18} /> },
  { id: 4, title: 'Academic Details', icon: <GraduationCap size={18} /> },
  { id: 5, title: 'Marks Entry', icon: <ClipboardList size={18} /> },
  { id: 6, title: 'Special Category', icon: <Award size={18} /> },
  { id: 7, title: 'College Choice', icon: <School size={18} /> },
  { id: 8, title: 'Uploads', icon: <FileCheck size={18} /> },
  { id: 9, title: 'Review & Submit', icon: <Check size={18} /> },
];

const fieldLabels = {
  fullName: 'Full Name', dob: 'Date of Birth', age: 'Age', gender: 'Gender', aadhaar: 'Aadhaar Number',
  religion: 'Religion', community: 'Community', caste: 'Caste', admissionType: 'Admission Type',
  citizenship: 'Citizenship', nativity: 'Nativity', civicNative: 'Civic Native',
  mobile: 'Mobile Number', email: 'Email Address', commAddress: 'Communication Address',
  fatherName: "Father's Name", motherName: "Mother's Name", parentOccupation: 'Parent Occupation',
  annualIncome: 'Annual Income', qualifyingBoard: 'Qualifying Board', registerNumber: 'Register Number',
  lastInstitute: 'Last Institute Name', hscRegisterNo: 'HSC Register Number',
  sslcRegisterNo: 'SSLC Register Number', sslcMarksheetNo: 'SSLC Marksheet Number',
  mediumOfInstruction: 'Medium of Instruction', civicSchoolType: 'Civic School Type',
  photoPath: 'Passport Photo', tcPath: 'Transfer Certificate', marksheetPath: 'SSLC marksheet',
  qualifyingMarksheetPath: 'HSC / ITI marksheet',
  communityPath: 'Community Certificate'
};

const stepRequiredFields = {
  1: ['fullName', 'dob', 'gender', 'aadhaar', 'religion', 'community', 'caste'],
  2: ['mobile', 'email', 'commAddress'],
  3: ['fatherName', 'motherName', 'parentOccupation', 'annualIncome'],
  4: ['mediumOfInstruction', 'civicSchoolType', 'qualifyingBoard', 'registerNumber', 'lastInstitute'],
  5: ['qualifyingType'],
  6: [], // Optional booleans
  7: [], // At least 1 pref checked in validator
  8: ['photoPath', 'marksheetPath'] // Minimum mandatory uploads
};

const defaultForm = {
  // Step 1
  fullName: '', dob: '', age: '', gender: '', aadhaar: '', religion: '', community: '', caste: '',
  admissionType: 'First Year', motherTongue: '', mediumOfInstruction: '', nativity: '',
  citizenship: '', civicNative: '',
  // Step 2
  mobile: '', email: '', alternateMobile: '', commAddress: '', permAddress: '', sameAsComm: false,
  // Step 4 Merged
  mediumOfInstruction: '', civicSchoolType: '',
  qualifyingBoard: '', registerNumber: '', lastInstitute: '', lastInstituteDistrict: '', lastInstituteState: '',
  // Comma-separated Education History
  standard_studied: '', standard_school_name: '', standard_yop: '', standard_district: '', standard_state: '',
  // Step 5
  qualifyingType: 'sslc',
  // Step 7+
  isDifferentlyAbled: false, isExServiceman: false, isSportsPerson: false, isGovtStudent: false,
  hostelRequired: false, womensHostel: false, preferences: [],
  photoPath: '', tcPath: '', marksheetPath: '', qualifyingMarksheetPath: '', communityPath: '',
};

import FormField from '../../components/Common/FormField';

const SUBJECT_CONFIG = {
  SSLC: { count: 5, subjects: ['Tamil', 'English', 'Maths', 'Science', 'Social'] },
  ITI: { count: 5, subjects: ['Trade Practical', 'Trade Theory', 'Work Shop', 'Drawing', 'Social'] },
  VOC: { count: 6, subjects: ['Language', 'English', 'Maths', 'Theory', 'Practical-I', 'Practical-II'] },
  HSC: { count: 6, subjects: ['Tamil', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology'] }
};

const MARK_TAB_ORDER = ['SSLC', 'HSC', 'ITI', 'VOC'];

const normalizeAdmissionType = (value) => {
  const raw = value != null ? String(value).trim() : '';
  if (raw === 'Lateral-1[12]' || raw === 'Lateral-2[ITI]' || raw === 'Lateral Entry (2nd Year)') {
    return 'Lateral Entry';
  }
  return raw;
};

const isLateralEntryAdmission = (value) => normalizeAdmissionType(value) === 'Lateral Entry';

const getAdmissionMarkTabConfig = (admissionType) => {
  const raw = normalizeAdmissionType(admissionType);
  const isFirstYear = raw === 'First Year';
  const isLateral = isLateralEntryAdmission(raw);
  const isPartTime = raw === 'Part Time';

  return MARK_TAB_ORDER.map((type) => {
    let enabled = true;
    if (isFirstYear) {
      enabled = type === 'SSLC';
    } else if (isLateral) {
      enabled = type !== 'SSLC';
    } else if (isPartTime) {
      enabled = true;
    }
    return { type, enabled };
  });
};

/** Application fee (INR) for payment / display; uses fees_master match on community, else default from server. */
function communityApplicationFeeInr(community, master) {
  const list = master?.communityFees;
  const def = Number(master?.defaultApplicationFee);
  const defaultFee = Number.isFinite(def) && def >= 0 ? Math.round(def) : 500;
  const c = (community || '').trim().toLowerCase();
  if (!c) return defaultFee;
  if (!Array.isArray(list)) return defaultFee;
  const row = list.find(
    (f) => f.community && String(f.community).trim().toLowerCase() === c
  );
  if (row == null || !Number.isFinite(Number(row.fees))) return defaultFee;
  return Math.max(0, Math.round(Number(row.fees)));
}

/** SC / SCA / ST: always zero fee on the portal (direct submit). Others use fees_master + default. */
const STATUTORY_NO_FEE_COMMUNITIES = ['SC', 'SCA', 'ST'];
const COMMON_UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';
const COMMON_UPLOAD_LABEL = 'PDF / JPG / JPEG / PNG / WEBP / DOC / DOCX';

function payableApplicationFeeInr(community, master) {
  const c = (community || '').trim().toUpperCase();
  if (STATUTORY_NO_FEE_COMMUNITIES.includes(c)) return 0;
  return communityApplicationFeeInr(community, master);
}

const getAdmissionAllowedMarkTabs = (admissionType) => {
  return getAdmissionMarkTabConfig(admissionType)
    .filter(tab => tab.enabled)
    .map(tab => tab.type);
};

/** Second marksheet upload only for lateral entry (SSLC + one other board), not Part Time with all tabs */
const admissionRequiresSecondMarksheetUpload = (admissionType) => {
  return isLateralEntryAdmission(admissionType);
};

const ApplicationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [modifyStepId, setModifyStepId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- NEW STRUCTURED STATE ---
  const [eduHistory, setEduHistory] = useState([{ standard: "6", school: "", year: "", state: "Tamil Nadu", district: "" }]);
  const [marksData, setMarksData] = useState({
    SSLC: { subjects: [] },
    ITI: { subjects: [] },
    HSC: { subjects: [] },
    VOC: { subjects: [] }
  });
  const [attempts, setAttempts] = useState({
    SSLC: { 1: { marksheetNo: "", registerNo: "", month: "", year: "", totalMatch: "" } },
    ITI: { 1: {} }, HSC: { 1: {} }, VOC: { 1: {} }
  });
  const [selectedAttempts, setSelectedAttempts] = useState({
    SSLC: [], ITI: [], HSC: [], VOC: []
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  const [colleges, setColleges] = useState([]);
  const [master, setMaster] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationNo, setApplicationNo] = useState('');

  const applicationFeeInr = useMemo(
    () => payableApplicationFeeInr(formData.community, master),
    [formData.community, master]
  );

  useEffect(() => {
    Promise.all([loadSavedData(), loadMaster(), loadColleges()])
      .finally(() => setLoading(false));
  }, []);


  // AUTO-UPDATE SUBJECTS WHEN BOARD CHANGES
  useEffect(() => {
    if (!master || !formData.qualifyingBoard) return;

    const board = formData.qualifyingBoard?.trim().toLocaleLowerCase();
    let subjects = [];

    if (board?.includes('cbse')) subjects = master.cbseSubjects || ['English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
    else if (board?.includes('icse')) subjects = master.icseSubjects || ['English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Science'];
    else if (board?.includes('state') || board?.includes('board')) subjects = master.stateBoardSubjects || ['Tamil', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology'];
    else if (board?.includes('iti')) subjects = master.itiSubjects || ['Trade Practical', 'Trade Theory', 'Work Shop', 'Drawing', 'Social'];
    else if (board?.includes('vocational')) subjects = master.vocationalSubjects || ['Language', 'English', 'Maths', 'Theory', 'Practical-I', 'Practical-II'];
    else subjects = master.otherSubjects || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5', 'Subject 6'];

    // Update all 6 subject names with board subjects
    setFormData(prev => ({
      ...prev,
      sub1Name: subjects[0] || '',
      sub2Name: subjects[1] || '',
      sub3Name: subjects[2] || '',
      sub4Name: subjects[3] || '',
      sub5Name: subjects[4] || '',
      sub6Name: subjects[5] || '',
    }));
  }, [formData.qualifyingBoard, master]);

  // AUTO-CALCULATE HSC PERCENTAGE AND CUTOFF MARK BASED ON MARKS ENTERED
  useEffect(() => {
    const marks = [
      { obt: formData.sub1Obtained, max: formData.sub1Max },
      { obt: formData.sub2Obtained, max: formData.sub2Max },
      { obt: formData.sub3Obtained, max: formData.sub3Max },
      { obt: formData.sub4Obtained, max: formData.sub4Max },
      { obt: formData.sub5Obtained, max: formData.sub5Max },
      { obt: formData.sub6Obtained, max: formData.sub6Max },
    ];

    // Calculate totals - only count if both obtained and max are filled
    let totalObtained = 0;
    let totalMax = 0;
    let countedSubjects = 0;

    marks.forEach(m => {
      const obt = Number(m.obt);
      const max = Number(m.max);
      if (!isNaN(obt) && !isNaN(max) && obt >= 0 && max > 0) {
        totalObtained += obt;
        totalMax += max;
        countedSubjects++;
      }
    });

    // Calculate percentage and cutoff only if we have at least one subject with marks
    if (countedSubjects > 0 && totalMax > 0) {
      const percentage = ((totalObtained / totalMax) * 100).toFixed(2);
      const cutoff = ((totalObtained / totalMax) * 200).toFixed(2);

      setFormData(prev => ({
        ...prev,
        hscPercentage: percentage,
        hscCutoff: cutoff,
      }));
    }
  }, [
    formData.sub1Obtained, formData.sub1Max,
    formData.sub2Obtained, formData.sub2Max,
    formData.sub3Obtained, formData.sub3Max,
    formData.sub4Obtained, formData.sub4Max,
    formData.sub5Obtained, formData.sub5Max,
    formData.sub6Obtained, formData.sub6Max,
  ]);

  // AUTO-CALCULATE SSLC PERCENTAGE BASED ON MARKS ENTERED
  useEffect(() => {
    const sslcMarks = [
      { obt: formData.sslcSub1Obt, max: formData.sslcSub1Max },
      { obt: formData.sslcSub2Obt, max: formData.sslcSub2Max },
      { obt: formData.sslcSub3Obt, max: formData.sslcSub3Max },
      { obt: formData.sslcSub4Obt, max: formData.sslcSub4Max },
      { obt: formData.sslcSub5Obt, max: formData.sslcSub5Max },
    ];

    // Calculate totals - only count if both obtained and max are filled
    let totalObtained = 0;
    let totalMax = 0;
    let countedSubjects = 0;

    sslcMarks.forEach(m => {
      const obt = Number(m.obt);
      const max = Number(m.max);
      if (!isNaN(obt) && !isNaN(max) && obt >= 0 && max > 0) {
        totalObtained += obt;
        totalMax += max;
        countedSubjects++;
      }
    });

    // Calculate percentage only if we have at least one subject with marks
    if (countedSubjects > 0 && totalMax > 0) {
      const percentage = ((totalObtained / totalMax) * 100).toFixed(2);

      setFormData(prev => ({
        ...prev,
        sslcPercentage: percentage,
      }));
    }
  }, [
    formData.sslcSub1Obt, formData.sslcSub1Max,
    formData.sslcSub2Obt, formData.sslcSub2Max,
    formData.sslcSub3Obt, formData.sslcSub3Max,
    formData.sslcSub4Obt, formData.sslcSub4Max,
    formData.sslcSub5Obt, formData.sslcSub5Max,
  ]);

  // AUTO-CALCULATE AGE FROM DOB
  useEffect(() => {
    if (!formData.dob) return;
    const today = new Date();
    const birth = new Date(formData.dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age >= 0) setFormData(prev => ({ ...prev, age: String(age) }));
  }, [formData.dob]);

  // CLEAR WOMEN'S HOSTEL PREFERENCE IF GENDER IS NOT FEMALE
  useEffect(() => {
    if (formData.gender && formData.gender?.toLowerCase() !== 'female' && formData.womensHostel) {
      setFormData(prev => ({
        ...prev,
        womensHostel: false,
      }));
    }
  }, [formData.gender]);

  // AUTO-SCROLL TO TOP ON STEP CHANGE
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Keep qualifying exam tab aligned with admission category (registration)
  useEffect(() => {
    const tabs = getAdmissionAllowedMarkTabs(formData.admissionType).map(t => t.toLowerCase());
    if (!tabs.length) return;
    const q = (formData.qualifyingType || '').toLowerCase();
    if (!tabs.includes(q)) {
      setFormData(prev => ({ ...prev, qualifyingType: tabs[0] }));
    }
  }, [formData.admissionType]);

  const flattenPayload = (data) => {
    const payload = {};

    // If same-as-comm is checked, copy commAddress to permAddress before saving
    if (data.sameAsComm) {
      data = { ...data, permAddress: data.commAddress };
    }

    // 1. Map student_master fields directly (allowed ones)
    const masterFields = [
      'fullName', 'dob', 'age', 'gender', 'aadhaar', 'religion', 'community', 'caste',
      'admissionType', 'motherTongue', 'mediumOfInstruction', 'nativity', 'citizenship', 'civicNative',
      'mobile', 'email', 'alternateMobile', 'commAddress', 'permAddress', 'sameAsComm',
      'fatherName', 'motherName', 'parentOccupation', 'annualIncome',
      'civicSchoolType', 'qualifyingBoard', 'registerNumber', 'lastInstitute', 'lastInstituteDistrict', 'lastInstituteState',
      'isDifferentlyAbled', 'isExServiceman', 'isSportsPerson', 'isGovtStudent',
      'hostelRequired', 'womensHostel', 'preferences'
    ];
    masterFields.forEach(f => { if (data[f] !== undefined) payload[f] = data[f]; });

    // 2. Flatten Edu History to Comma Separated Strings
    payload.standard_studied = eduHistory.map(row => row.standard).join(',');
    payload.standard_school_name = eduHistory.map(row => row.school).join(',');
    payload.standard_yop = eduHistory.map(row => row.year).join(',');
    payload.standard_district = eduHistory.map(row => row.district).join(',');
    payload.standard_state = eduHistory.map(row => row.state).join(',');

    // 3. Map Mark Details — save every examination relevant to this admission category
    const markTabs = getAdmissionAllowedMarkTabs(data.admissionType);
    markTabs.forEach((tab) => {
      const type = tab.toLowerCase();
      payload[type] = 'Yes';

      const typeKey = tab;
      const typeData = marksData[typeKey] || { subjects: [] };
      const config = SUBJECT_CONFIG[typeKey] || { subjects: [] };

      const totalObt = config.subjects.reduce((sum, _, idx) => {
        return sum + (Number(typeData.subjects[idx]?.obtained) || 0);
      }, 0);

      const totalMax = config.subjects.length * 100;
      const percentage = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(2) : '0.00';

      payload[`${type}_total_obtained_mark`] = totalObt.toString();
      payload[`${type}_total_mark`] = totalMax.toString();
      payload[`${type}_percentage`] = percentage;
      if (type === 'hsc') {
        payload[`${type}_cutoff`] = ((totalObt / totalMax) * 200).toFixed(2);
      }

      typeData.subjects.forEach((sub, i) => {
        const sIdx = i + 1;
        payload[`${type}_subject${sIdx}`] = sub.name;
        payload[`${type}_subject${sIdx}_obtained_mark`] = sub.obtained;
        payload[`${type}_subject${sIdx}_max_mark`] = sub.max;
      });

      const selectedIds = selectedAttempts[typeKey] || [1];
      selectedIds.forEach(attId => {
        const attData = attempts[typeKey]?.[attId] || {};
        const attPrefix = `${type}_att${attId}_`;
        payload[`${attPrefix}marksheet_no`] = attData.marksheetNo || '';
        payload[`${attPrefix}register_no`] = attData.registerNo || '';
        payload[`${attPrefix}month`] = attData.month || '';
        payload[`${attPrefix}year`] = attData.year || '';
        payload[`${attPrefix}total_marks`] = attData.totalMatch || '';
      });
    });

    return payload;
  };

  const unflattenData = (s, m) => {
    // 1. Un-flatten Edu History
    if (s.standard_studied) {
      const standards = s.standard_studied.split(',');
      const schools = (s.standard_school_name || '').split(',');
      const years = (s.standard_yop || '').split(',');
      const districts = (s.standard_district || '').split(',');
      const states = (s.standard_state || '').split(',');

      const history = standards.map((std, i) => ({
        standard: std,
        school: schools[i] || '',
        year: years[i] || '',
        district: districts[i] || '',
        state: states[i] || ''
      }));
      setEduHistory(history);
    }

    // 2. Identify active mark tab (must stay within admission-allowed tabs)
    const allTypes = MARK_TAB_ORDER;
    const allowedTabs = getAdmissionAllowedMarkTabs(normalizeAdmissionType(s.admission_type));
    const fromMarks = allTypes.find(t => m && m[`${t.toLowerCase()}_subject1`]);
    const fromFlags = allTypes.find(t => s[t.toLowerCase()] === 'yes' || s[t.toLowerCase()] === 'Yes');
    const candidate = (fromMarks && allowedTabs.includes(fromMarks) ? fromMarks : null)
      || (fromFlags && allowedTabs.includes(fromFlags) ? fromFlags : null)
      || allowedTabs[0]
      || 'SSLC';
    const activePrefix = candidate.toLowerCase();

    const newMarksData = { ...marksData };
    const newAttempts = { ...attempts };
    const newSelected = { ...selectedAttempts };

    allTypes.forEach(t => {
      const prefix = t.toLowerCase();

      // Un-flatten main subject marks for this type
      if (m[`${prefix}_subject1`]) {
        const subjects = [];
        for (let i = 1; i <= 6; i++) {
          if (m[`${prefix}_subject${i}`]) {
            subjects.push({
              name: m[`${prefix}_subject${i}`],
              obtained: m[`${prefix}_subject${i}_obtained_mark`] || '',
              max: m[`${prefix}_subject${i}_max_mark`] || '100'
            });
          }
        }
        if (subjects.length > 0) {
          newMarksData[t] = { subjects };
        }
      }

      // Un-flatten attempts for this type
      const typeSel = [];
      const typeAtts = {};
      for (let i = 1; i <= 5; i++) {
        const attPrefix = `${prefix}_att${i}_`;
        if (m && m[`${attPrefix}marksheet_no`]) {
          typeSel.push(i);
          typeAtts[i] = {
            marksheetNo: m[`${attPrefix}marksheet_no`],
            registerNo: m[`${attPrefix}register_no`],
            month: m[`${attPrefix}month`],
            year: m[`${attPrefix}year`],
            totalMatch: m[`${attPrefix}total_marks`]
          };
        }
      }
      if (typeSel.length > 0) {
        newSelected[t] = typeSel;
        newAttempts[t] = { ...newAttempts[t], ...typeAtts };
      }
    });

    setMarksData(newMarksData);
    setAttempts(newAttempts);
    setSelectedAttempts(newSelected);

    // Restore basic fields for the active type
    setFormData(prev => ({
      ...prev,
      qualifyingType: activePrefix,
      lastInstituteState: s.last_institution_state || prev.lastInstituteState
    }));
  };

  const loadSavedData = async () => {
    try {
      const res = await axios.get('/api/student/me', { withCredentials: true });
      if (!res.data.success) return;
      const s = res.data.student;
      const m = res.data.marks;
      setIsSubmitted(res.data.isSubmitted);
      setApplicationNo(res.data.applicationNo || '');
      setFormData(prev => ({
        ...prev,
        fullName: s.student_name || '',
        dob: s.dob ? s.dob.split('T')[0] : '',
        gender: s.gender || '',
        aadhaar: s.aadhar || '',
        religion: s.religion || '',
        community: s.community || '',
        caste: s.caste || '',
        admissionType: normalizeAdmissionType(s.admission_type) || prev.admissionType,
        motherTongue: s.mother_tongue || '',
        mediumOfInstruction: s.medium_of_instruction || '',
        nativity: s.nativity || '',
        age: s.age !== null && s.age !== undefined ? String(s.age) : '',
        citizenship: s.citizenship || '',
        civicNative: s.civic_native || '',
        mobile: s.mobile ? String(s.mobile) : '',
        email: s.email || '',
        alternateMobile: s.alt_mobile ? String(s.alt_mobile) : '',
        commAddress: s.communication_address || '',
        permAddress: s.permanent_address || '',
        fatherName: s.father_name || '',
        motherName: s.mother_name || '',
        parentOccupation: s.parent_occupation || '',
        annualIncome: s.parent_annual_income || '',
        civicSchoolType: s.civic_school_type || '',
        qualifyingBoard: s.last_institution_board || '',
        registerNumber: s.last_institution_register_no || '',
        lastInstitute: s.last_institution_name || '',
        lastInstituteDistrict: s.last_institution_district || '',
        isDifferentlyAbled: s.differently_abled === 'yes',
        isExServiceman: s.ex_servicemen === 'yes',
        isSportsPerson: s.eminent_sports === 'yes',
        isGovtStudent: s.school_type === 'govt',
        hostelRequired: s.hostel_choice === 'yes',
        womensHostel: s.womens_choice === 'yes',
        preferences: s.college_choices ? (() => { try { return JSON.parse(s.college_choices); } catch { return []; } })() : [],
        photoPath: s.photo || '',
        tcPath: s.transfer_certificate || '',
        marksheetPath: s.marksheet_certificate || '',
        qualifyingMarksheetPath: s.qualifying_marksheet_certificate || '',
        communityPath: s.community_certificate || '',
        ...(m ? {
          hscRegisterNo: m.hsc_register_no || '',
          hscExamType: m.hsc_exam_type || '',
          hscMajorStream: m.hsc_major_stream || '',
          sub1Name: m.hsc_subject1 || 'English', sub1Obtained: m.hsc_subject1_obtained_mark || '', sub1Max: m.hsc_subject1_max_mark || '100',
          sub2Name: m.hsc_subject2 || 'Maths', sub2Obtained: m.hsc_subject2_obtained_mark || '', sub2Max: m.hsc_subject2_max_mark || '100',
          sub3Name: m.hsc_subject3 || 'Physics', sub3Obtained: m.hsc_subject3_obtained_mark || '', sub3Max: m.hsc_subject3_max_mark || '100',
          sub4Name: m.hsc_subject4 || 'Chemistry', sub4Obtained: m.hsc_subject4_obtained_mark || '', sub4Max: m.hsc_subject4_max_mark || '100',
          sub5Name: m.hsc_subject5 || '', sub5Obtained: m.hsc_subject5_obtained_mark || '', sub5Max: m.hsc_subject5_max_mark || '100',
          sub6Name: m.hsc_subject6 || '', sub6Obtained: m.hsc_subject6_obtained_mark || '', sub6Max: m.hsc_subject6_max_mark || '100',
          hscPercentage: m.hsc_percentage || '', hscCutoff: m.hsc_cutoff || '',
          sslcRegisterNo: m.sslc_register_no || '', sslcMarksheetNo: m.sslc_marksheet_no || '',
          sslcSub1: m.sslc_subject1 || 'Tamil', sslcSub1Obt: m.sslc_subject1_obtained_mark || '', sslcSub1Max: m.sslc_subject1_max_mark || '100',
          sslcSub2: m.sslc_subject2 || 'English', sslcSub2Obt: m.sslc_subject2_obtained_mark || '', sslcSub2Max: m.sslc_subject2_max_mark || '100',
          sslcSub3: m.sslc_subject3 || 'Maths', sslcSub3Obt: m.sslc_subject3_obtained_mark || '', sslcSub3Max: m.sslc_subject3_max_mark || '100',
          sslcSub4: m.sslc_subject4 || 'Science', sslcSub4Obt: m.sslc_subject4_obtained_mark || '', sslcSub4Max: m.sslc_subject4_max_mark || '100',
          sslcSub5: m.sslc_subject5 || 'Social', sslcSub5Obt: m.sslc_subject5_obtained_mark || '', sslcSub5Max: m.sslc_subject5_max_mark || '100',
          sslcPercentage: m.sslc_percentage || '',
        } : {}),
      }));

      // Re-hydrate structured state
      unflattenData(s, m);
    } catch { }
  };

  const loadMaster = async () => {
    try {
      const res = await axios.get('/api/master');
      setMaster(res.data);
    } catch { }
  };

  const loadColleges = async () => {
    try {
      const res = await axios.get('/api/master/colleges');
      setColleges(res.data.colleges || []);
    } catch { }
  };

  const handleDistrictChange = (field, districtName, stateTargetField) => {
    const districtObj = master?.districts?.find(d => (d.district_name || d.name) === districtName);
    setFormData(prev => ({
      ...prev,
      [field]: districtName,
      [stateTargetField]: districtObj ? districtObj.state_name : prev[stateTargetField]
    }));
  };

  const handleEduHistoryDistrictChange = (index, districtName) => {
    const districtObj = master?.districts?.find(d => (d.district_name || d.name) === districtName);
    const newHistory = [...eduHistory];
    newHistory[index].district = districtName;
    if (districtObj) newHistory[index].state = districtObj.state_name;
    setEduHistory(newHistory);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Cascade resets for interdependent dropdowns
    if (name === 'religion') {
      setFormData(prev => ({ ...prev, religion: value, community: '', caste: '' }));
      setErrors(prev => ({ ...prev, religion: null, community: null, caste: null }));
      return;
    }
    if (name === 'community') {
      setFormData(prev => ({ ...prev, community: value, caste: '' }));
      setErrors(prev => ({ ...prev, community: null, caste: null }));
      return;
    }

    // Numeric-only enforcement for specific fields
    const numericFields = ['aadhaar', 'mobile', 'alternateMobile', 'annualIncome', 'registerNumber', 'hscRegisterNo', 'sslcRegisterNo'];
    const markFields = ['Obtained', 'Max', 'Obt']; // Matches sub1Obtained, sslcSub1Obt, etc.

    if (numericFields.includes(name) || markFields.some(suffix => name.endsWith(suffix))) {
      // Allow only digits
      const cleanValue = value.replace(/\D/g, '');

      // Mark validation: Clear if > 100 (only for obtained marks)
      const isObtainedMark = name.endsWith('Obtained') || name.endsWith('Obt');
      if (isObtainedMark && Number(cleanValue) > 100) {
        setFormData(prev => ({ ...prev, [name]: '' }));
        return;
      }

      // Length limits
      if (name === 'aadhaar' && cleanValue.length > 12) return;
      if (name === 'alternateMobile' && cleanValue.length > 10) return;

      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePreferenceChange = (index, value) => {
    setFormData(prev => {
      const prefs = Array.isArray(prev.preferences) ? [...prev.preferences] : [];
      // Ensure array is large enough
      while (prefs.length <= index) {
        prefs.push('');
      }
      // Set or remove value
      if (value === null) {
        prefs.pop(); // Remove last item
      } else {
        prefs[index] = value;
      }
      return { ...prev, preferences: prefs };
    });
  };

  const handleFileUpload = async (file, docType) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`/api/student/upload?docType=${docType}`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        const pathKey = {
          photo: 'photoPath',
          tc: 'tcPath',
          marksheet: 'marksheetPath',
          marksheetQualifying: 'qualifyingMarksheetPath',
          community: 'communityPath'
        }[docType];
        if (!pathKey) {
          toast.error('Unknown document type');
          return;
        }
        setFormData(prev => ({ ...prev, [pathKey]: res.data.path }));
        toast.success('File uploaded successfully!');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Upload failed. Please try again.';
      toast.error(typeof msg === 'string' ? msg : 'Upload failed. Please try again.');
    }
  };

  const saveCurrentStep = async () => {
    if (currentStep === 9) return true;
    setSaving(true);
    const payload = flattenPayload(formData);
    try {
      await axios.put(`/api/student/step/${currentStep}`, payload, { withCredentials: true });
      return true;
    } catch {
      toast.error('Failed to save. Please check your connection.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const isStepComplete = (id) => {
    if (isSubmitted) return true;
    const fields = stepRequiredFields[id] || [];
    const hasBaseFields = fields.every(f => !!formData[f]);
    if (!hasBaseFields) return false;

    // Custom secondary validations
    if (id === 1) {
      if (formData.aadhaar && formData.aadhaar.length !== 12) return false;
    }
    if (id === 2) {
      if (formData.mobile && formData.mobile.length !== 10) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) return false;
    }
    if (id === 5) {
      const tabs = getAdmissionAllowedMarkTabs(formData.admissionType);
      const q = (formData.qualifyingType || '').toUpperCase();
      if (!tabs.length || !tabs.includes(q)) return false;
      const allMarksOk = tabs.every((tab) => {
        const typeData = marksData[tab];
        return typeData?.subjects?.some(s => s?.obtained !== undefined && s?.obtained !== '' && Number(s.obtained) >= 0);
      });
      if (!allMarksOk) return false;
    }
    if (id === 7) {
      if (!formData.preferences || formData.preferences.filter(Boolean).length === 0) return false;
    }
    if (id === 8) {
      if (!formData.photoPath || !formData.marksheetPath) return false;
      if (admissionRequiresSecondMarksheetUpload(formData.admissionType) && !formData.qualifyingMarksheetPath) return false;
    }

    return true;
  };

  const validateStep = (id) => {
    // 1. Check basic required fields from stepRequiredFields
    const fields = stepRequiredFields[id] || [];
    const stepErrors = {};
    let isValid = true;

    fields.forEach(f => {
      if (!formData[f]) {
        stepErrors[f] = `${fieldLabels[f] || f} is required`;
        isValid = false;
      }
    });

    // 2. Format & Length validations
    if (id === 1) {
      if (formData.aadhaar && formData.aadhaar.length !== 12) {
        stepErrors.aadhaar = "Aadhaar must be exactly 12 digits";
        isValid = false;
      }
    }

    if (id === 2) {
      if (formData.mobile && formData.mobile.length !== 10) {
        stepErrors.mobile = "Mobile number must be exactly 10 digits";
        isValid = false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        stepErrors.email = "Invalid email format";
        isValid = false;
      }
      if (formData.alternateMobile && formData.alternateMobile.length !== 10) {
        stepErrors.alternateMobile = "Alternate mobile number must be 10 digits";
        isValid = false;
      }
    }

    if (id === 7) {
      if (!formData.preferences || formData.preferences.filter(Boolean).length === 0) {
        isValid = false;
      }
    }

    if (id === 5) {
      const tabs = getAdmissionAllowedMarkTabs(formData.admissionType);
      const q = (formData.qualifyingType || '').toUpperCase();
      if (!tabs.includes(q)) {
        stepErrors.qualifyingType = 'Select a valid qualifying examination for your admission category';
        isValid = false;
      }
      const missingMarksTab = tabs.find((tab) => {
        const typeData = marksData[tab];
        return !typeData?.subjects?.some(s => s?.obtained !== undefined && s?.obtained !== '' && Number(s.obtained) >= 0);
      });
      if (missingMarksTab) {
        stepErrors.marks = `Enter marks for every subject tab required for your course (${tabs.join(', ')}).`;
        isValid = false;
      }
    }

    if (id === 8) {
      if (admissionRequiresSecondMarksheetUpload(formData.admissionType) && !formData.qualifyingMarksheetPath) {
        stepErrors.qualifyingMarksheetPath = `${fieldLabels.qualifyingMarksheetPath} is required`;
        isValid = false;
      }
    }

    if (!isValid) {
      setErrors(stepErrors);
    } else {
      setErrors({});
    }

    return isValid;
  };

  const handleNext = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitted) {
      setCurrentStep(p => Math.min(p + 1, steps.length));
      return;
    }

    if (!validateStep(currentStep)) return;

    const saved = await saveCurrentStep();
    if (saved) {
      const stepTitle = steps.find(s => s.id === currentStep)?.title || `Step ${currentStep}`;
      const isModifyFlow = modifyStepId === currentStep;
      toast.success(`${stepTitle} saved and synced!`, { autoClose: 1200 });
      
      if (isModifyFlow) {
        setModifyStepId(null);
        setCurrentStep(9);
      } else {
        setCurrentStep(p => Math.min(p + 1, steps.length));
      }
    }
  };

  const handleModifyStep = (stepId) => {
    setModifyStepId(stepId);
    setCurrentStep(stepId);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitted) { navigate('/student/my-application'); return; }

    // Ensure all steps are valid before final submit
    for (let i = 1; i < 10; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    const isFree = applicationFeeInr <= 0;

    if (isFree) {
      processFinalSubmission();
    } else {
      navigate('/student/payment', {
        state: {
          amountInr: applicationFeeInr,
          community: formData.community,
          fullName: formData.fullName,
        },
      });
    }
  };

  const processFinalSubmission = async (paymentId = null) => {
    setSaving(true);
    try {
      const res = await axios.post('/api/student/submit', { paymentId }, { withCredentials: true });
      if (res.data.success) {
        setIsSubmitted(true);
        setApplicationNo(res.data.applicationNo);
        toast.success(`Application submitted! ID: ${res.data.applicationNo}`);

        // Auto-download PDF
        try {
          generateApplicationPDF(formData, res.data.applicationNo);
        } catch (pdfErr) {
          console.error('PDF Gen failed:', pdfErr);
          toast.info('Application submitted! (Note: PDF generation requires jspdf library)');
        }
      } else {
        toast.error(res.data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const onFormAction = currentStep === 9 ? handleSubmit : handleNext;

  if (loading) {
    return (
      <MainLayout role="student">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Application State...</p>
        </div>
      </MainLayout>
    );
  }

  if (isSubmitted && currentStep !== 9) {
    return (
      <MainLayout role="student">
        <div className="max-w-6xl mx-auto px-0 md:px-8 py-4 md:py-10">
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xl relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <FileCheck size={200} />
            </div>

            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Check size={48} strokeWidth={3} />
            </div>

            <h2 className="text-3xl font-black text-blue-950 mb-4 uppercase tracking-tighter">Application Locked</h2>
            <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
              Your application has been received and is currently under review. You cannot create a new application or modify the existing one at this stage.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 mb-10 inline-block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Registered Application Number</p>
              <p className="text-4xl font-black text-blue-950 tracking-widest">{applicationNo}</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/student/my-application')}
                className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                <FileCheck size={18} /> View Official Report
              </button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 shadow-md">
              <Briefcase size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-blue-900 uppercase mb-1">Need help with your application?</h4>
              <p className="text-xs font-bold text-blue-700 leading-relaxed">
                If you believe there is an error in your submitted details that requires correction, please contact the DOTE support desk with your application reference number.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="student">
      <div className="max-w-6xl mx-auto px-1 md:px-0 space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-3xl font-black text-blue-950 tracking-tighter">Student Admission Portal</h2>
            <p className="text-[9px] font-bold text-orange-600 bg-yellow-100 uppercase tracking-[0.2em] mt-3 px-3 py-1.5 rounded-full inline-block select-none shadow-sm">
              Directorate of Technical Education (DOTE) • Admission 2026
            </p>
          </div>

          {isSubmitted && (
            <div className="bg-emerald-50 text-emerald-700 px-6 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Submitted: {applicationNo}</span>
            </div>
          )}
        </header>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h3 className="text-xl font-black text-blue-950">Step {currentStep} of 9: <span className="text-blue-600">{steps[currentStep - 1].title}</span></h3>
            </div>
            <div className="w-full md:w-64">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                {steps.map((step, idx) => {
                  const isCompleted = isStepComplete(step.id) && (currentStep > step.id || isSubmitted);
                  const isActive = currentStep === step.id;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ width: 0 }}
                      animate={{ width: `${100 / steps.length}%` }}
                      className={`h-full border-r border-white/20 last:border-none transition-colors duration-500
                        ${isCompleted || isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {steps.filter(s => isStepComplete(s.id) && (currentStep > s.id || isSubmitted)).length} / {steps.length} Steps Done
                </p>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{Math.round((steps.filter(s => isStepComplete(s.id) && (currentStep > s.id || isSubmitted)).length / steps.length) * 100)}% Complete</p>
              </div>
            </div>
          </div>

          {/* Premium Admission Timeline 2026 - Optimized for Mobile & Desktop */}
          <div className="pt-6 pb-8 border-t border-slate-100 bg-slate-50/20 px-2 lg:px-0">
            <div className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide snap-mandatory snap-x">
              <div className="flex items-start justify-between min-w-162.5 lg:min-w-0 lg:w-full relative px-6 md:px-0 py-4">
                {steps.map((step, idx) => {
                  const isCompleted = isStepComplete(step.id) && (currentStep > step.id || isSubmitted);
                  const isActive = currentStep === step.id;
                  const canNavigate = isSubmitted || isCompleted || (currentStep > step.id);

                  return (
                    <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">

                      {/* Connecting Line Segment between nodes */}
                      {idx !== 0 && (
                        <div
                          className={`absolute top-5 right-[calc(50%+22px)] w-[calc(100%-44px)] h-[2.5px] transition-all duration-700
                            ${isCompleted || isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
                          style={{ zIndex: -1 }}
                        />
                      )}

                      {/* Step Node Circle - Responsive Sizing */}
                      <button
                        type="button"
                        onClick={() => canNavigate && setCurrentStep(step.id)}
                        disabled={!canNavigate}
                        className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm snap-center
                          ${isActive
                            ? 'bg-white border-blue-600 scale-110 shadow-xl shadow-blue-100 ring-4 ring-blue-50'
                            : isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white hover:scale-105'
                              : 'bg-white border-slate-200 text-slate-300'}`}
                      >
                        {isCompleted ? (
                          <Check size={18} strokeWidth={3} className="animate-in zoom-in duration-300" />
                        ) : (
                          <span className={`text-sm font-black ${isActive ? 'text-blue-600' : 'text-slate-300'}`}>
                            {step.id}
                          </span>
                        )}

                        {/* Glow for Active */}
                        {isActive && <div className="absolute inset-0 rounded-full bg-blue-600/10 animate-pulse" />}
                      </button>

                      {/* Compact Labels - Hidden on XS Mobile, adaptive sizing */}
                      <div className="text-center mt-3 hidden sm:block">
                        <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest mb-1 transition-colors duration-300
                          ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {isActive ? 'Active' : isCompleted ? 'Done' : 'Wait'}
                        </p>
                        <h4 className={`text-[8px] md:text-[9px] font-black leading-tight tracking-tight transition-all duration-300 max-w-15 md:max-w-17.5 mx-auto
                          ${isActive || isCompleted ? 'text-blue-950' : 'text-slate-400 opacity-60'}`}>
                          {step.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={onFormAction} className="bg-white border border-slate-200 p-4 md:p-8 shadow-sm rounded-lg relative">
          <div className="space-y-8">
            {currentStep === 1 && (
              <PersonalDetails
                data={formData}
                errors={errors}
                onChange={handleInputChange}
                master={master}
                disabled={isSubmitted}
                applicationFeeInr={applicationFeeInr}
              />
            )}
            {currentStep === 2 && <ContactInfo data={formData} errors={errors} onChange={handleInputChange} disabled={isSubmitted} />}
            {currentStep === 3 && <ParentDetails data={formData} errors={errors} onChange={handleInputChange} master={master} disabled={isSubmitted} />}
            {currentStep === 4 && <AcademicDetails data={formData} errors={errors} onChange={handleInputChange} onDistrictChange={handleDistrictChange} onEduHistDistrictChange={handleEduHistoryDistrictChange} master={master} eduHistory={eduHistory} setEduHistory={setEduHistory} disabled={isSubmitted} />}
            {currentStep === 5 && (
              <div className="space-y-8">
                <SectionTitle title="5. Marks Entry" subtitle="Select your qualifying examination, enter subject marks, and manage attempts." />
                {errors.marks && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">{errors.marks}</div>
                )}
                {errors.attempts && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">{errors.attempts}</div>
                )}
                <EducationSelector
                  selectedType={formData.qualifyingType}
                  setQualifyingType={(t) => setFormData({ ...formData, qualifyingType: t.toLowerCase() })}
                  tabConfig={getAdmissionMarkTabConfig(formData.admissionType)}
                  disabled={isSubmitted}
                />
                {formData.qualifyingType && (
                  <>
                    <MarksTable type={formData.qualifyingType} data={marksData} setData={setMarksData} disabled={isSubmitted} />
                    <div className="pt-10 mt-10 border-t border-dashed border-slate-200">
                      <AttemptManager type={formData.qualifyingType} attempts={attempts} setAttempts={setAttempts} selectedAttempts={selectedAttempts} setSelectedAttempts={setSelectedAttempts} disabled={isSubmitted} />
                    </div>
                  </>
                )}
              </div>
            )}
            {currentStep === 6 && <SpecialCategory data={formData} onChange={handleInputChange} disabled={isSubmitted} />}
            {currentStep === 7 && <CollegeChoice data={formData} onChange={handleInputChange} onPrefChange={handlePreferenceChange} colleges={colleges} master={master} disabled={isSubmitted} />}
            {currentStep === 8 && (
              <DocumentUploads
                data={formData}
                onUpload={handleFileUpload}
                onPreview={setPreviewUrl}
                disabled={isSubmitted}
              />
            )}
            {currentStep === 9 && <FormSummary data={formData} onGoToStep={handleModifyStep} isSubmitted={isSubmitted} applicationNo={applicationNo} eduHistory={eduHistory} marksData={marksData} attempts={attempts} selectedAttempts={selectedAttempts} colleges={colleges} onPreview={setPreviewUrl} />}
          </div>

          <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4 pt-10 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCurrentStep(p => Math.max(p - 1, 1))}
              className="px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border bg-blue-600 text-white hover:bg-blue-700 border-blue-500/30 active:scale-[0.98]"
            >
              Previous
            </button>

            {currentStep < 9 && (
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all border border-blue-500/30 active:scale-[0.98]">
                {saving ? 'Saving...' : modifyStepId === currentStep ? 'Update' : 'Save and Continue'}
              </button>
            )}

            {currentStep === 9 && !isSubmitted && (
              <button type="button" onClick={handleSubmit} disabled={saving}
                className="bg-emerald-600 text-white px-12 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all border border-emerald-500/30 active:scale-[0.98]">
                {saving ? 'Submitting...' : 'Confirm Submission'}
              </button>
            )}

            {currentStep === 9 && isSubmitted && (
              <button type="button" onClick={() => navigate('/student/my-application')}
                className="bg-blue-900 text-white px-12 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-950 transition-all active:scale-[0.98]">
                Close View
              </button>
            )}
          </div>
        </form>

        {/* Global Document Preview Modal */}
        <AnimatePresence>
          {previewUrl && (
            <PreviewModal 
              url={previewUrl} 
              onClose={() => setPreviewUrl(null)} 
            />
          )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
};

// ─────────────────────────────────────────────────────────
// Simplified Shared Components
// ─────────────────────────────────────────────────────────
const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-6 pb-2 border-b border-slate-100">
    <h3 className="text-lg font-bold text-blue-950 tracking-tight decoration-blue-500 decoration-2">{title}</h3>
    {subtitle && <p className="text-orange-600 text-[10px] font-bold uppercase tracking-widest mt-2 bg-yellow-100 px-4 py-1.5 rounded-full inline-block shadow-sm border border-yellow-200/50">{subtitle}</p>}
  </div>
);

const CheckboxCard = ({ label, name, checked, onChange, disabled = false }) => (
  <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${disabled ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60' : checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-slate-50'}`}>
    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
      {checked && <Check size={14} strokeWidth={4} />}
    </div>
    <span className={`text-xs font-bold uppercase tracking-wider ${checked ? 'text-blue-800' : 'text-slate-500'}`}>{label}</span>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" disabled={disabled} />
  </label>
);

// ─────────────────────────────────────────────────────────
// Form Summary / Review Component
// ─────────────────────────────────────────────────────────
const FormSummary = ({ data, onGoToStep, isSubmitted, applicationNo, eduHistory, marksData, attempts, selectedAttempts, colleges, onPreview }) => {
  const SummarySection = ({ title, stepId, children }) => (
    <div className="bg-white rounded-xl p-4 md:p-8 border border-slate-200 mb-6 relative shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h4 className="text-[11px] md:text-sm font-black text-blue-900 uppercase tracking-widest">{title}</h4>
        {!isSubmitted && (
          <button type="button" onClick={() => onGoToStep(stepId)} className="text-[10px] font-black text-blue-600 uppercase hover:underline bg-blue-50 px-3 py-1 rounded-full transition-all">
            Edit Section
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
        {children}
      </div>
    </div>
  );

  const SummaryField = ({ label, value }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-bold text-blue-950 wrap-break-word text-sm">{value || <span className="text-red-400 font-medium italic">Not Provided</span>}</p>
    </div>
  );

  const SummaryDocPreview = ({ label, path, onPreview }) => (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      {path ? (
        <button type="button" onClick={() => onPreview(path)} className="block group text-left">
          <div className="w-24 h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex flex-col items-center justify-center transition-all group-hover:border-blue-400 group-hover:shadow-md relative">
            {path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={path} alt={label} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mt-1">
                  <FileCheck size={20} strokeWidth={3} />
                </div>
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">View Document</span>
              </div>
            )}
            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 bg-white/90 p-1.5 rounded-full shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <Eye size={14} className="text-blue-600" />
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="w-24 h-28 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center opacity-60">
          <Trash2 size={16} className="text-slate-300 mb-2" />
          <span className="text-red-400 text-[8px] font-black uppercase tracking-tighter italic">Not Provided</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="px-1 md:px-2">
      <div className="mb-8 p-4 md:p-10 bg-blue-950 rounded-2xl text-white shadow-xl shadow-blue-100">
        <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight mb-2 text-white! italic">Review Application Details</h3>
        <p className="text-blue-200 text-[10px] md:text-sm font-medium leading-relaxed max-w-2xl">
          Please verify all information before final submission. Once submitted, details cannot be changed without administrative intervention.
        </p>
      </div>

      <SummarySection title="1. Personal Information" stepId={1}>
        <SummaryField label="Full Name" value={data.fullName} />
        <SummaryField label="Date of Birth" value={data.dob} />
        <SummaryField label="Age" value={data.age ? `${data.age} years` : ''} />
        <SummaryField label="Gender" value={data.gender} />
        <SummaryField label="Aadhaar Number" value={data.aadhaar} />
        <SummaryField label="Religion" value={data.religion} />
        <SummaryField label="Community" value={data.community} />
        <SummaryField label="Caste" value={data.caste} />
        <SummaryField label="Admission Type" value={data.admissionType} />
        <SummaryField label="Citizenship" value={data.citizenship} />
        <SummaryField label="Nativity" value={data.nativity} />
        <SummaryField label="Civic Native" value={data.civicNative} />
      </SummarySection>

      <SummarySection title="2. Communication Details" stepId={2}>
        <SummaryField label="Mobile Number" value={data.mobile} />
        <SummaryField label="Email Address" value={data.email} />
        <SummaryField label="Alternate Mobile" value={data.alternateMobile} />
        <SummaryField label="Communication Address" value={data.commAddress} />
        <SummaryField label="Permanent Address" value={data.sameAsComm ? "Same as Communication" : data.permAddress} />
      </SummarySection>

      <SummarySection title="3. Parent/Guardian Information" stepId={3}>
        <SummaryField label="Father's Name" value={data.fatherName} />
        <SummaryField label="Mother's Name" value={data.motherName} />
        <SummaryField label="Occupation" value={data.parentOccupation} />
        <SummaryField label="Annual Income" value={data.annualIncome ? `₹${Number(data.annualIncome).toLocaleString('en-IN')}` : ''} />
      </SummarySection>

      <SummarySection title="4. Academic Details" stepId={4}>
        <SummaryField label="Medium" value={data.mediumOfInstruction} />
        <SummaryField label="School Type" value={data.civicSchoolType} />
        <SummaryField label="Qualifying Board" value={data.qualifyingBoard} />
        <SummaryField label="Register Number" value={data.registerNumber} />
        <SummaryField label="District" value={data.lastInstituteDistrict} />
        <SummaryField label="State" value={data.lastInstituteState} />
        <div className="md:col-span-3 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-2">Schooling Progression</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {eduHistory.map((row, i) => (
              <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100">
                <p className="text-[9px] font-black text-blue-600 mb-1">{row.standard}</p>
                <p className="text-[10px] font-bold text-slate-700 truncate">{row.school}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{row.year}</p>
              </div>
            ))}
          </div>
        </div>
      </SummarySection>

      <SummarySection title="5. Marks Entry" stepId={5}>
        {getAdmissionAllowedMarkTabs(data.admissionType).map((tab) => (
          <div key={tab} className="md:col-span-3 grid md:grid-cols-3 gap-6 border-b border-slate-100 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
            <div className="bg-blue-600 p-4 rounded text-white shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-1">Examination</p>
              <p className="text-xl font-black">{tab}</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {marksData[tab]?.subjects?.slice(0, 6).map((s, i) => (
                <div key={`${tab}-${i}`} className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{s.name}</span>
                  <span className="text-xs font-bold text-slate-800">{s.obtained} / {s.max}</span>
                </div>
              ))}
            </div>
            <div className="md:col-span-3 mt-2 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attempts — {tab}</p>
              {selectedAttempts[tab]?.map(id => (
                <div key={`${tab}-att-${id}`} className="flex flex-wrap gap-x-8 gap-y-2 bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-black">{id}</div>
                  <SummaryField label="Reg No" value={attempts[tab]?.[id]?.registerNo} />
                  <SummaryField label="Marksheet" value={attempts[tab]?.[id]?.marksheetNo} />
                  <SummaryField label="Year" value={attempts[tab]?.[id]?.year} />
                  <SummaryField label="Total Marks" value={attempts[tab]?.[id]?.totalMatch} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </SummarySection>

      <SummarySection title="6. Special Category" stepId={6}>
        <SummaryField label="Differently Abled" value={data.isDifferentlyAbled ? "Yes" : "No"} />
        <SummaryField label="Ex-Serviceman" value={data.isExServiceman ? "Yes" : "No"} />
        <SummaryField label="Sports Person" value={data.isSportsPerson ? "Yes" : "No"} />
      </SummarySection>

      <SummarySection title="7. College Preferences" stepId={7}>
        <SummaryField label="Hostel Required" value={data.hostelRequired ? "Yes" : "No"} />
        {data.gender?.toLowerCase() === 'female' && <SummaryField label="Women's Hostel" value={data.womensHostel ? "Yes" : "No"} />}
        <div className="md:col-span-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Priority List</p>
          <div className="space-y-2">
            {(data.preferences || []).filter(Boolean).map((code, idx) => {
              const col = colleges.find(c => c.ins_code === code);
              return (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{col?.ins_name || `College ${code}`}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{col?.ins_city || 'Code'}: {code}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SummarySection>

      <SummarySection title="8. Uploaded Documents" stepId={8}>
        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <SummaryDocPreview label="Passport Photo" path={data.photoPath} onPreview={onPreview} />
          <SummaryDocPreview label="Transfer Cert." path={data.tcPath} onPreview={onPreview} />
          <SummaryDocPreview label="SSLC marksheet" path={data.marksheetPath} onPreview={onPreview} />
          {(data.qualifyingMarksheetPath || admissionRequiresSecondMarksheetUpload(data.admissionType)) && (
            <SummaryDocPreview
              label={
                getAdmissionAllowedMarkTabs(data.admissionType).includes('HSC')
                  ? 'HSC marksheet'
                  : getAdmissionAllowedMarkTabs(data.admissionType).includes('ITI')
                    ? 'ITI marksheet'
                    : 'Additional marksheet'
              }
              path={data.qualifyingMarksheetPath}
              onPreview={onPreview}
            />
          )}
          <SummaryDocPreview label="Community Cert." path={data.communityPath} onPreview={onPreview} />
        </div>
      </SummarySection>

      {isSubmitted && (
        <div className="mt-12 p-10 bg-emerald-600 rounded-lg text-white text-center shadow-lg border-2 border-emerald-700">
          <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check size={32} strokeWidth={3} />
          </div>
          <h4 className="text-2xl font-bold mb-2">Application Submitted Successfully</h4>
          <p className="text-emerald-100 text-sm font-medium mb-8 max-w-lg mx-auto">Your application has been received. Please note your application number for reference.</p>

          <div className="inline-block bg-white/20 px-10 py-4 rounded border border-white/30 mb-8">
            <p className="text-emerald-50 text-[10px] font-bold uppercase tracking-widest mb-1">Application Reference Number</p>
            <p className="text-4xl font-bold text-white tracking-widest">{applicationNo}</p>
          </div>

          {/* <div className="flex justify-center">
            <button 
              type="button"
              onClick={() => generateApplicationPDF(formData, applicationNo)}
              className="flex items-center gap-3 bg-white text-emerald-700 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 transition-all shadow-xl"
            >
              <FileCheck size={20} /> Download Application PDF
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Step components
// ─────────────────────────────────────────────────────────
const PersonalDetails = ({ data, errors, onChange, master, disabled, applicationFeeInr = 0 }) => {
  const [casteOther, setCasteOther] = React.useState(false);

  // Derive filtered communities based on selected religion from the hierarchy
  const religionObj = master?.religions?.find(r => r.name === data.religion);
  const religionEntry = religionObj ? master?.religionHierarchy?.[religionObj.id] : null;
  const availableCommunities = religionEntry?.communities?.length
    ? religionEntry.communities
    : null; // null = fall back to full list

  // Derive filtered castes based on selected religion, then narrow by community if possible
  const communityEntry = availableCommunities?.find(c => c.communityName === data.community);
  const availableCastes = communityEntry?.castes?.length
    ? communityEntry.castes
    : (religionEntry?.castes || []);
  const hasCastes = availableCastes.length > 0;

  // Keep casteOther in sync when parent clears caste
  React.useEffect(() => {
    if (!data.caste) setCasteOther(false);
  }, [data.religion, data.community, data.caste]);

  // Clear stale caste values when the selected religion/community no longer supports them
  React.useEffect(() => {
    if (!data.caste || casteOther) return;
    if (!hasCastes) return;
    const casteStillValid = availableCastes.some(c => c.casteName === data.caste);
    if (!casteStillValid) {
      onChange({ target: { name: 'caste', value: '' } });
    }
  }, [availableCastes, casteOther, data.caste, hasCastes, onChange]);

  const handleCasteSelect = (e) => {
    if (e.target.value === '__others__') {
      setCasteOther(true);
      onChange({ target: { name: 'caste', value: '' } });
    } else {
      setCasteOther(false);
      onChange({ target: { name: 'caste', value: e.target.value } });
    }
  };

  const casteSelectValue = casteOther
    ? '__others__'
    : (hasCastes && availableCastes.some(c => c.casteName === data.caste) ? data.caste : '');

  return (
  <div className="space-y-8">
    {/* Admission Category Badge - At Top, Non-Editable */}
    <div className="flex justify-center">
      <div className="flex items-center justify-center gap-3 px-6 py-3 bg-linear-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-full shadow-sm">
        <span className="text-xs font-black uppercase tracking-widest text-blue-600">Admission Category</span>
        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
        <span className="text-sm font-black text-blue-900">{data.admissionType}</span>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
      <div className="md:col-span-2">
        <SectionTitle title="1. Personal Information" subtitle="Enter your legal details as they appear on your official school and identification documents." />
      </div>

    <FormField label="Full Name" required error={errors.fullName} tooltip="Enter as per school records" disabled={disabled} layout="horizontal">
      <input type="text" name="fullName" value={data.fullName} onChange={onChange} placeholder="Full Name" disabled={disabled} />
    </FormField>

    <FormField label="Date of Birth" required error={errors.dob} disabled={disabled} layout="horizontal">
      <input type="date" name="dob" value={data.dob} onChange={onChange} disabled={disabled} />
    </FormField>

    <FormField label="Gender" required error={errors.gender} disabled={disabled} layout="horizontal">
      <select name="gender" value={data.gender} onChange={onChange} disabled={disabled}>
        <option value="">Select Gender</option>
        {(master?.gender || ['Male', 'Female', 'Transgender']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </FormField>

    <FormField label="Aadhaar Number (12-Digit)" required error={errors.aadhaar} disabled={disabled} layout="horizontal">
      <input type="text" name="aadhaar" value={data.aadhaar} onChange={onChange} maxLength={12} placeholder="XXXX XXXX XXXX" disabled={disabled} />
    </FormField>

    <FormField label="Religion" required error={errors.religion} disabled={disabled} layout="horizontal">
      <select name="religion" value={data.religion} onChange={onChange} disabled={disabled}>
        <option value="">Select Religion</option>
        {(master?.religion || ['Hindu', 'Christian', 'Muslim', 'Sikh', 'Others']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </FormField>

    <FormField label="Community" required error={errors.community} disabled={disabled} layout="horizontal">
      <select name="community" value={data.community} onChange={onChange} disabled={!data.religion || disabled}>
        <option value="">{data.religion ? 'Select Community' : 'Select Religion first'}</option>
        {availableCommunities
          ? availableCommunities.map(c => (
              <option key={c.communityId} value={c.communityName}>{c.communityName}</option>
            ))
          : (master?.communities || ['BC', 'BCM', 'BCO', 'MBC/DNC', 'OC', 'SC', 'SCA', 'ST']).map(opt => {
              const label = opt.community_name || opt;
              return <option key={opt.id || label} value={label}>{label}</option>;
            })
        }
      </select>
      {data.community ? (
        <p className="text-[11px] font-semibold text-slate-500 mt-1.5">
          Application fee for this community:{' '}
          <span className="text-blue-700">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(applicationFeeInr)}
          </span>
          {STATUTORY_NO_FEE_COMMUNITIES.includes((data.community || '').trim().toUpperCase()) ? (
            <span className="text-emerald-800 font-bold"> (SC / SCA / ST — no fee; submit without payment page)</span>
          ) : applicationFeeInr <= 0 ? (
            <span className="text-emerald-700 font-bold"> (no payment required)</span>
          ) : (
            <span className="text-slate-600 font-medium"> (paid on the payment page after you confirm)</span>
          )}
        </p>
      ) : null}
    </FormField>

    <FormField label="Caste Name" required error={errors.caste} disabled={disabled} layout="horizontal">
      {hasCastes ? (
        <>
          <select
            value={casteSelectValue}
            onChange={handleCasteSelect}
            disabled={!data.religion || disabled}
          >
            <option value="">{data.religion ? 'Select Caste' : 'Select Religion first'}</option>
            {availableCastes.map(c => (
              <option key={c.casteId} value={c.casteName}>{c.casteName}</option>
            ))}
            <option value="__others__">Others (specify below)</option>
          </select>
          {casteOther && (
            <input
              type="text"
              name="caste"
              value={data.caste}
              onChange={onChange}
              placeholder="Type your caste name"
              className="mt-2"
              disabled={disabled}
            />
          )}
        </>
      ) : (
        <input
          type="text"
          name="caste"
          value={data.caste}
          onChange={onChange}
          placeholder={data.religion ? 'Enter caste / sub-caste' : 'Select Religion first'}
          disabled={disabled}
        />
      )}
    </FormField>

    <FormField label="Mother Tongue" disabled={disabled} layout="horizontal">
      <select name="motherTongue" className="bg-slate-50/50" value={data.motherTongue} onChange={onChange} disabled={disabled}>
        <option value="">Select Language</option>
        {(master?.motherTongue || ['Tamil', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Hindi', 'Others']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </FormField>

    <FormField label="Age" disabled={true} layout="horizontal">
      <input type="number" name="age" value={data.age} readOnly disabled
        className="bg-slate-100 text-slate-600 font-bold cursor-not-allowed"
        placeholder="Auto-filled from Date of Birth" />
    </FormField>

    <FormField label="Citizenship" error={errors.citizenship} disabled={disabled} layout="horizontal">
      <select name="citizenship" value={data.citizenship} onChange={onChange} disabled={disabled}>
        <option value="">Select Citizenship</option>
        <option value="Indian">Indian</option>
        <option value="Others">Others</option>
      </select>
    </FormField>

    <FormField label="Nativity" error={errors.nativity} disabled={disabled} layout="horizontal">
      <select name="nativity" value={data.nativity} onChange={onChange} disabled={disabled}>
        <option value="">Select Nativity</option>
        <option value="Tamil Nadu">Tamil Nadu</option>
        <option value="Other State">Other State</option>
      </select>
    </FormField>

    <FormField label="District" error={errors.civicNative} disabled={disabled} layout="horizontal">
      <select name="civicNative" value={data.civicNative} onChange={onChange} disabled={disabled}>
        <option value="">Select District</option>
        <option value="Ariyalur">Ariyalur</option>
        <option value="Chengalpattu">Chengalpattu</option>
        <option value="Chennai">Chennai</option>
        <option value="Coimbatore">Coimbatore</option>
        <option value="Cuddalore">Cuddalore</option>
        <option value="Dharmapuri">Dharmapuri</option>
        <option value="Dindigul">Dindigul</option>
        <option value="Erode">Erode</option>
        <option value="Kallakurichi">Kallakurichi</option>
        <option value="Kanchipuram">Kanchipuram</option>
        <option value="Kanyakumari">Kanyakumari</option>
        <option value="Karur">Karur</option>
        <option value="Krishnagiri">Krishnagiri</option>
        <option value="Madurai">Madurai</option>
        <option value="Mayiladuthurai">Mayiladuthurai</option>
        <option value="Nagapattinam">Nagapattinam</option>
        <option value="Namakkal">Namakkal</option>
        <option value="Nilgiris">Nilgiris</option>
        <option value="Perambalur">Perambalur</option>
        <option value="Pudukkottai">Pudukkottai</option>
        <option value="Ramanathapuram">Ramanathapuram</option>
        <option value="Ranipet">Ranipet</option>
        <option value="Salem">Salem</option>
        <option value="Sivaganga">Sivaganga</option>
        <option value="Tenkasi">Tenkasi</option>
        <option value="Thanjavur">Thanjavur</option>
        <option value="Theni">Theni</option>
        <option value="Thiruvallur">Thiruvallur</option>
        <option value="Thiruvannamalai">Thiruvannamalai</option>
        <option value="Thiruvarur">Thiruvarur</option>
        <option value="Thoothukudi">Thoothukudi</option>
        <option value="Tirupathur">Tirupathur</option>
        <option value="Tiruppur">Tiruppur</option>
        <option value="Tiruchirappalli">Tiruchirappalli</option>
        <option value="Vellore">Vellore</option>
        <option value="Villupuram">Villupuram</option>
      </select>
    </FormField>
    </div>
  </div>
  );
};

const ContactInfo = ({ data, errors, onChange, disabled }) => (
  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
    <div className="md:col-span-2">
      <SectionTitle title="2. Communication Details" subtitle="Enter your contact information accurately for official correspondence and notifications." />
    </div>

    <FormField label="Mobile Number" required error={errors.mobile} disabled={disabled} layout="horizontal">
      <input type="text" name="mobile" value={data.mobile} onChange={onChange} placeholder="10-digit mobile number" maxLength={10} disabled={disabled} />
    </FormField>

    <FormField label="Alternate Mobile Number" error={errors.alternateMobile} disabled={disabled} layout="horizontal">
      <input type="text" name="alternateMobile" value={data.alternateMobile} onChange={onChange} placeholder="10-digit number" disabled={disabled} />
    </FormField>

    <div className="md:col-span-2">
      <FormField label="Email Address" required error={errors.email} disabled={disabled} layout="horizontal">
        <input type="email" name="email" value={data.email} onChange={onChange} placeholder="email@example.com" disabled={disabled} />
      </FormField>
    </div>

    <div className="md:col-span-2">
      <FormField label="Permanent Address" required error={errors.commAddress} disabled={disabled} layout="horizontal">
        <textarea name="commAddress" className="min-h-30 py-3 px-4 resize-none" value={data.commAddress} onChange={onChange} placeholder="House No, Street, Village/City, District, Pincode" required disabled={disabled} />
      </FormField>
    </div>

    <div className="md:col-span-2 flex items-start gap-4 bg-slate-50 p-6 border border-slate-200 rounded">
      <input type="checkbox" name="sameAsComm" checked={data.sameAsComm} onChange={onChange} className="w-5 h-5 mt-1" disabled={disabled} />
      <div>
        <span className="text-sm font-bold text-slate-800 tracking-tight">Permanent Address is same as Current Address</span>
        <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Uncheck to enter a different permanent location</p>
      </div>
    </div>

    {!data.sameAsComm && (
      <div className="md:col-span-2">
        <FormField label="Current Address" disabled={disabled} layout="horizontal">
          <textarea name="permAddress" className="min-h-30 py-3 px-4 resize-none" value={data.permAddress} onChange={onChange} placeholder="Enter full permanent address..." disabled={disabled} />
        </FormField>
      </div>
    )}
  </div>
);

const ParentDetails = ({ data, errors, onChange, disabled }) => (
  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
    <div className="md:col-span-2">
      <SectionTitle title="3. Parent/Guardian Information" subtitle="Provide parental/guardian background details for identity and eligibility verification." />
    </div>

    <FormField label="Father's Full Name" required error={errors.fatherName} disabled={disabled} layout="horizontal">
      <input type="text" name="fatherName" value={data.fatherName} onChange={onChange} placeholder="Full Name" disabled={disabled} />
    </FormField>

    <FormField label="Mother's Full Name" required error={errors.motherName} disabled={disabled} layout="horizontal">
      <input type="text" name="motherName" value={data.motherName} onChange={onChange} placeholder="Full Name" disabled={disabled} />
    </FormField>

    <FormField label="Parent Occupation" required error={errors.parentOccupation} disabled={disabled} layout="horizontal">
      <input
        type="text"
        name="parentOccupation"
        value={data.parentOccupation}
        onChange={onChange}
        placeholder="Type occupation"
        required
        disabled={disabled}
      />
    </FormField>

    <FormField label="Family Annual Income (₹)" required error={errors.annualIncome} tooltip="Total yearly household income" disabled={disabled} layout="horizontal">
      <input type="number" name="annualIncome" value={data.annualIncome} onChange={onChange} placeholder="Amount in Rupees" required disabled={disabled} />
    </FormField>
  </div>
);

const AcademicDetails = ({ data, errors, onChange, onDistrictChange, onEduHistDistrictChange, master, eduHistory, setEduHistory, disabled }) => (
  <div className="space-y-12">
    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
      <div className="md:col-span-2">
        <SectionTitle title="4. Academic Details" subtitle="Enter your medium of instruction, school type, and previous institution details." />
      </div>

      <FormField label="Medium of Instruction" required error={errors.mediumOfInstruction} disabled={disabled} layout="horizontal">
        <select name="mediumOfInstruction" value={data.mediumOfInstruction} onChange={onChange} disabled={disabled}>
          <option value="">Select Medium</option>
          {(master?.mediumOfInstruction || ['Tamil', 'English', 'Other']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </FormField>

      <FormField label="Civic School Type" required error={errors.civicSchoolType} disabled={disabled} layout="horizontal">
        <select name="civicSchoolType" value={data.civicSchoolType} onChange={onChange} disabled={disabled}>
          <option value="">Select Type</option>
          {['Government', 'Municipality', 'Corporation', 'Panchayat Union', 'Government Aided', 'Private', 'Central Government'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </FormField>

      <FormField label="Qualifying Examination Board" required error={errors.qualifyingBoard} disabled={disabled} layout="horizontal">
        <select name="qualifyingBoard" value={data.qualifyingBoard} onChange={onChange} required disabled={disabled}>
          <option value="">Select Board</option>
          {(master?.qualifyingBoard || ['State Board', 'CBSE', 'ICSE', 'ITI', 'Others']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </FormField>

      <FormField label="Roll Number / Register Number" required error={errors.registerNumber} disabled={disabled} layout="horizontal">
        <input type="text" name="registerNumber" value={data.registerNumber} onChange={onChange} placeholder="Last Exam Reg No" required disabled={disabled} />
      </FormField>

      <div className="md:col-span-2">
        <FormField label="Last Institution Name (School / College)" required error={errors.lastInstitute} disabled={disabled} layout="horizontal">
          <input type="text" name="lastInstitute" value={data.lastInstitute} onChange={onChange} placeholder="Full School / College Name" required disabled={disabled} />
        </FormField>
      </div>

      <FormField label="Institution District" disabled={disabled} layout="horizontal">
        <select name="lastInstituteDistrict" value={data.lastInstituteDistrict} onChange={e => onDistrictChange('lastInstituteDistrict', e.target.value, 'lastInstituteState')} disabled={disabled}>
          <option value="">Select District</option>
          {master?.districts?.map(d => {
            const name = d.district_name || d.name;
            return <option key={d.id || name} value={name}>{name}</option>;
          })}
        </select>
      </FormField>

      <FormField label="Institution State" disabled={disabled} layout="horizontal">
        <input type="text" name="lastInstituteState" value={data.lastInstituteState} placeholder="Auto-filled" readOnly disabled={disabled} className="bg-slate-50 font-bold" />
      </FormField>
    </div>

    <div className="pt-8 border-t border-slate-200">
      <SectionTitle title="Educational History" subtitle="Add your schooling progression from 6th standard onwards." />
      <EducationHistory eduHistory={eduHistory} setEduHistory={setEduHistory} onDistrictChange={onEduHistDistrictChange} master={master} disabled={disabled} />
    </div>
  </div>
);

const MarksEntry = ({ data, errors, onChange, master, disabled }) => {
  const getSubjectsForBoard = () => {
    const board = data.qualifyingBoard?.trim().toLocaleLowerCase();
    if (board?.includes('cbse')) return master?.cbseSubjects || ['English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
    if (board?.includes('icse')) return master?.icseSubjects || ['English', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Science'];
    if (board?.includes('state') || board?.includes('board')) return master?.stateBoardSubjects || ['Language', 'English', 'Maths', 'Physics', 'Chemistry', 'Biology'];
    if (board?.includes('iti')) return master?.itiSubjects || ['Trade Practical', 'Trade Theory', 'Work Shop', 'Drawing', 'Social'];
    return master?.otherSubjects || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5', 'Subject 6'];
  };

  const defaultSubjects = getSubjectsForBoard();
  const subjects = [
    { nameKey: 'sub1Name', obtKey: 'sub1Obtained', maxKey: 'sub1Max', default: defaultSubjects[0] || 'Subject 1' },
    { nameKey: 'sub2Name', obtKey: 'sub2Obtained', maxKey: 'sub2Max', default: defaultSubjects[1] || 'Subject 2' },
    { nameKey: 'sub3Name', obtKey: 'sub3Obtained', maxKey: 'sub3Max', default: defaultSubjects[2] || 'Subject 3' },
    { nameKey: 'sub4Name', obtKey: 'sub4Obtained', maxKey: 'sub4Max', default: defaultSubjects[3] || 'Subject 4' },
    { nameKey: 'sub5Name', obtKey: 'sub5Obtained', maxKey: 'sub5Max', default: defaultSubjects[4] || 'Subject 5' },
    { nameKey: 'sub6Name', obtKey: 'sub6Obtained', maxKey: 'sub6Max', default: defaultSubjects[5] || 'Subject 6' },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle title="5. Qualifying Marks Entry" subtitle="Enter your marks as per your official marksheet. Cutoff and percentage will be calculated automatically." />

      {!data.qualifyingBoard && (
        <div className="bg-red-50 p-8 border border-red-200 rounded text-center">
          <p className="text-red-700 font-bold mb-2 uppercase tracking-wide">Board Not Selected</p>
          <p className="text-sm text-red-600">Please go back to Step 4 and select your Qualifying examination board first.</p>
        </div>
      )}

      {data.qualifyingBoard && (
        <>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sl.No</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject Name</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Marks Obtained</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Maximum Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s, index) => (
                  <tr key={s.nameKey} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <input type="text" name={s.nameKey} value={data[s.nameKey] || s.default} onChange={onChange} className="w-full text-xs font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-700" placeholder={s.default} disabled={disabled} />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" name={s.obtKey} value={data[s.obtKey]} onChange={onChange} className="w-24 mx-auto block text-center font-bold text-blue-600 border border-slate-200 rounded py-1.5 px-2 focus:ring-1 focus:ring-blue-500 text-sm" placeholder="0" disabled={disabled} />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" name={s.maxKey} value={data[s.maxKey]} onChange={onChange} className="w-24 mx-auto block text-center font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded py-1.5 px-2 text-sm" placeholder="100" disabled={disabled} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="p-6 border-2 border-slate-200 rounded-lg bg-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Percentage Aggregate</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{data.hscPercentage || '0.00'} %</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <Percent size={24} />
              </div>
            </div>
            <div className="p-6 border-2 border-blue-600 rounded-lg bg-blue-50 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Engineering Cutoff Score</p>
                <p className="text-3xl font-black text-blue-900 tracking-tight">{data.hscCutoff || '0.00'} <span className="text-sm font-bold opacity-40">/ 200</span></p>
              </div>
              <div className="w-12 h-12 bg-blue-100/50 rounded-full flex items-center justify-center text-blue-600">
                <Award size={24} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const DetailedHistory = ({ data, errors, onChange, disabled }) => (
  <div className="space-y-8">
    <SectionTitle title="6. SSLC (10th) Mark Matrix" subtitle="Provide your secondary school leaving certificate details and mark breakdown." />

    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
      <FormField label="SSLC Register Number" required error={errors.sslcRegisterNo} disabled={disabled}>
        <input type="text" name="sslcRegisterNo" value={data.sslcRegisterNo} onChange={onChange} placeholder="Secondary Exam ID" disabled={disabled} />
      </FormField>
      <FormField label="Marksheet Serial Number" required error={errors.sslcMarksheetNo} disabled={disabled}>
        <input type="text" name="sslcMarksheetNo" value={data.sslcMarksheetNo} onChange={onChange} placeholder="Serial Number" disabled={disabled} />
      </FormField>
    </div>

    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sl.No</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Marks Obtained</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Max Marks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            { label: 'Language 1 (Tamil/Other)', nameKey: 'sslcSub1', obtKey: 'sslcSub1Obt', maxKey: 'sslcSub1Max' },
            { label: 'Language 2 (English)', nameKey: 'sslcSub2', obtKey: 'sslcSub2Obt', maxKey: 'sslcSub2Max' },
            { label: 'Mathematics', nameKey: 'sslcSub3', obtKey: 'sslcSub3Obt', maxKey: 'sslcSub3Max' },
            { label: 'Science', nameKey: 'sslcSub4', obtKey: 'sslcSub4Obt', maxKey: 'sslcSub4Max' },
            { label: 'Social Science', nameKey: 'sslcSub5', obtKey: 'sslcSub5Obt', maxKey: 'sslcSub5Max' },
          ].map((s, idx) => (
            <tr key={s.nameKey} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
              <td className="px-6 py-4 text-xs font-bold text-slate-700">{s.label}</td>
              <td className="px-6 py-4">
                <input type="number" name={s.obtKey} value={data[s.obtKey]} onChange={onChange} className="w-24 mx-auto block text-center font-bold text-blue-600 bg-white border border-slate-300 rounded py-2 px-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none shadow-sm" placeholder="0" disabled={disabled} />
              </td>
              <td className="px-6 py-4">
                <input type="number" name={s.maxKey} value={data[s.maxKey]} onChange={onChange} className="w-20 mx-auto block text-center font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded py-1 px-2 text-sm" placeholder="100" disabled={disabled} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="bg-slate-800 p-6 rounded-lg text-white flex justify-between items-center">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SSLC Cumulative Percentage</p>
        <p className="text-xs text-slate-500">Calculated based on 5 primary subjects</p>
      </div>
      <p className="text-3xl font-black">{data.sslcPercentage || '0.00'} %</p>
    </div>
  </div>
);

const SpecialCategory = ({ data, onChange, disabled }) => (
  <div className="space-y-6">
    <SectionTitle title="6. Special Category Reservations" subtitle="Select applicable categories for reservation eligibility." />
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CheckboxCard label="Physically Abled" name="isDifferentlyAbled" checked={data.isDifferentlyAbled} onChange={onChange} disabled={disabled} />
      <CheckboxCard label="Ex-Serviceman" name="isExServiceman" checked={data.isExServiceman} onChange={onChange} disabled={disabled} />
      <CheckboxCard label="Eminent Sports Person" name="isSportsPerson" checked={data.isSportsPerson} onChange={onChange} disabled={disabled} />
    </div>
    <div className="p-4 bg-blue-50 text-blue-800 rounded border border-blue-200 text-xs font-semibold flex items-start gap-3">
      <div className="bg-blue-600 text-white rounded-full p-0.5 shrink-0 mt-0.5"><Check size={12} strokeWidth={4} /></div>
      <p>Information provided here must be supported by original government certificates during the time of admission verification.</p>
    </div>
  </div>
);

const CollegeChoice = ({ data, onChange, onPrefChange, colleges, master, disabled }) => {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // All colleges from API are already filtered to ins_type_id IN (1,2) and ins_status=1
  // We strictly show only Govt (1) and Aided (2) as requested.
  const validColleges = colleges.filter(c => 
    [1, 2].includes(Number(c.ins_type_id)) || 
    ['government', 'aided', 'government aided'].includes(c.ins_type?.toLowerCase().trim())
  );
  // Standardized types for filter dropdown
  const types = ['Government', 'Aided'];

  const normalizeCollegeCategory = (category) => {
    const value = (category || '').toLowerCase().replace(/[\s-]/g, '');
    if (!value) return '';
    if (value.includes('coeducation') || value.includes('coed') || value.includes('both') || value.includes('mixed')) return 'coed';
    if (value.includes('women') || value.includes('female') || value.includes('girls')) return 'female';
    if (value.includes('men') || value.includes('male') || value.includes('boys')) return 'male';
    return '';
  };

  // Auto-filter by student gender:
  // Male -> Male + Co-ed, Female -> Women + Co-ed
  const studentGender = data.gender?.toLowerCase();
  const autoAllowedCategories = studentGender === 'female'
    ? ['female', 'coed']
    : studentGender === 'male'
      ? ['male', 'coed']
      : [];
  const autoCategoryLabel = studentGender === 'female'
    ? 'Women + Co-ed'
    : studentGender === 'male'
      ? 'Male + Co-ed'
      : 'All';

  const filteredColleges = validColleges.filter(c => {
    const matchDistrict = !districtFilter || c.ins_district?.toLowerCase() === districtFilter.toLowerCase();
    let matchType = true;
    if (typeFilter === 'Government') {
      matchType = Number(c.ins_type_id) === 1 || c.ins_type === 'Government';
    } else if (typeFilter === 'Aided') {
      matchType = Number(c.ins_type_id) === 2 || c.ins_type?.toLowerCase().includes('aided');
    }
    const matchSearch = !search ||
      c.ins_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.ins_code?.toLowerCase().includes(search.toLowerCase()) ||
      c.ins_district?.toLowerCase().includes(search.toLowerCase());
    const normalizedCategory = normalizeCollegeCategory(c.ins_category);
    let matchCategory = true;

    if (autoAllowedCategories.length) {
      matchCategory = autoAllowedCategories.includes(normalizedCategory);
    }

    // Hostel filter
    const matchHostel = !data.hostelRequired || c.ins_hostel?.toLowerCase() === 'yes';
    return matchDistrict && matchType && matchSearch && matchCategory && matchHostel;
  });

  // Always work with clean array of ins_code strings
  const selectedCodes = Array.isArray(data.preferences)
    ? data.preferences.filter(Boolean)
    : [];

  const toggleCollege = (ins_code) => {
    if (disabled) return;
    const idx = selectedCodes.indexOf(ins_code);
    let newCodes;
    if (idx > -1) {
      // Deselect
      newCodes = selectedCodes.filter(c => c !== ins_code);
    } else {
      // Select — add to end
      newCodes = [...selectedCodes, ins_code];
    }
    // Push all updates
    newCodes.forEach((code, i) => onPrefChange(i, code));
    // Remove trailing entries if list shrank
    if (newCodes.length < selectedCodes.length) {
      onPrefChange(newCodes.length, null);
    }
  };

  const moveUp = (idx) => {
    if (disabled || idx === 0) return;
    const newCodes = [...selectedCodes];
    [newCodes[idx - 1], newCodes[idx]] = [newCodes[idx], newCodes[idx - 1]];
    newCodes.forEach((code, i) => onPrefChange(i, code));
  };

  const moveDown = (idx) => {
    if (disabled || idx === selectedCodes.length - 1) return;
    const newCodes = [...selectedCodes];
    [newCodes[idx + 1], newCodes[idx]] = [newCodes[idx], newCodes[idx + 1]];
    newCodes.forEach((code, i) => onPrefChange(i, code));
  };

  const getCollege = (code) => validColleges.find(c => c.ins_code === code);

  return (
    <div className="space-y-6">
      <SectionTitle title="7. College Preferences" subtitle="Search and select your preferred colleges. Check to add, uncheck to remove. Drag to reorder priority." />

      {/* Top Filter Bar */}
      <div className="grid md:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">Search College</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, code or district..."
            className="w-full text-xs font-bold border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">By District</label>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} disabled={disabled}
            className="w-full text-xs font-bold border border-slate-300 rounded px-3 py-2">
            <option value="">All Districts</option>
            {(master?.districts || []).map(d => {
              const name = d.district_name || d.name;
              return <option key={d.id || name} value={name}>{name}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">By Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} disabled={disabled}
            className="w-full text-xs font-bold border border-slate-300 rounded px-3 py-2">
            <option value="">Both</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Facility Options — Hostel filter + save preference */}
      <div className="flex flex-wrap gap-3">
        <label className={`flex items-center gap-3 px-4 py-2 rounded border cursor-pointer transition-all ${disabled ? 'opacity-60' : data.hostelRequired ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}>
          <input type="checkbox" name="hostelRequired" checked={data.hostelRequired} onChange={onChange} className="w-4 h-4" disabled={disabled} />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">✓ I Need Hostel Accommodation</span>
        </label>
        {data.gender?.toLowerCase() === 'female' && (
          <label className={`flex items-center gap-3 px-4 py-2 rounded border cursor-pointer transition-all ${disabled ? 'opacity-60' : data.womensHostel ? 'border-pink-500 bg-pink-50' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}>
            <input type="checkbox" name="womensHostel" checked={data.womensHostel} onChange={onChange} className="w-4 h-4" disabled={disabled} />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">♀ Women's Hostel Preference</span>
          </label>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* College Checkbox List */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">Available Colleges</span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">{filteredColleges.length} found</span>
          </div>
          <div className="overflow-y-auto max-h-105 divide-y divide-slate-100">
            {filteredColleges.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-wider italic">
                No colleges match your filters
              </div>
            ) : (
              filteredColleges.map(c => {
                const isSelected = selectedCodes.includes(c.ins_code);
                const rank = selectedCodes.indexOf(c.ins_code) + 1;
                return (
                  <label key={c.ins_code}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-50'} ${isSelected ? 'bg-blue-50/60 border-l-2 border-blue-500' : ''}`}>
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                        {isSelected ? <Check size={12} strokeWidth={4} /> : null}
                      </div>
                    </div>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleCollege(c.ins_code)} className="hidden" disabled={disabled} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isSelected && <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded">#{rank}</span>}
                        <span className="text-[9px] font-bold text-slate-400">[{c.ins_code}]</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 leading-tight">{c.ins_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{c.ins_city} · {c.ins_type}</p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Priority List */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">Your Priority List</span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">{selectedCodes.length} selected</span>
          </div>
          <div className="overflow-y-auto max-h-105">
            {selectedCodes.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-wider italic">
                Check colleges on the left to add them here
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedCodes.map((code, idx) => {
                  const c = getCollege(code);
                  if (!c) return null;
                  return (
                    <div key={code} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-all">
                      <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{c.ins_code}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{c.ins_type}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate">{c.ins_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{c.ins_city}</p>
                      </div>
                      {!disabled && (
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors text-xs font-black">▲</button>
                          <button type="button" onClick={() => moveDown(idx)} disabled={idx === selectedCodes.length - 1}
                            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors text-xs font-black">▼</button>
                        </div>
                      )}
                      {!disabled && (
                        <button type="button" onClick={() => toggleCollege(code)}
                          className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentUploads = ({ data, onUpload, onPreview, disabled }) => {
  const markTabs = getAdmissionAllowedMarkTabs(data.admissionType);
  const needSecondMs = admissionRequiresSecondMarksheetUpload(data.admissionType);
  const secondLabel = markTabs.includes('HSC') ? 'HSC marksheet' : markTabs.includes('ITI') ? 'ITI marksheet' : 'Qualifying marksheet';

  return (
  <div className="space-y-8">
    <SectionTitle title="8. Document Cabinet" subtitle="Upload clear scanned copies of your official certificates for verification." />
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
        File Size Disclaimer: Minimum 150 KB and Maximum 5 MB per document.
      </p>
      <p className="text-[10px] font-semibold text-amber-700 mt-1">
        Files outside this size range will not be uploaded. Supported formats: {COMMON_UPLOAD_LABEL}.
      </p>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <UploadBox label="Passport Photo" subLabel={`Mandatory • ${COMMON_UPLOAD_LABEL}`} docType="photo" currentPath={data.photoPath} onUpload={onUpload} onPreview={onPreview} accept={COMMON_UPLOAD_ACCEPT} disabled={disabled} />
      <UploadBox label="SSLC marksheet" subLabel={`10th / SSLC scan • ${COMMON_UPLOAD_LABEL}`} docType="marksheet" currentPath={data.marksheetPath} onUpload={onUpload} onPreview={onPreview} accept={COMMON_UPLOAD_ACCEPT} disabled={disabled} />
      {needSecondMs && (
        <UploadBox label={secondLabel} subLabel={`Mandatory • ${COMMON_UPLOAD_LABEL}`} docType="marksheetQualifying" currentPath={data.qualifyingMarksheetPath} onUpload={onUpload} onPreview={onPreview} accept={COMMON_UPLOAD_ACCEPT} disabled={disabled} />
      )}
      <UploadBox label="Transfer Certificate" subLabel={`PDF / Image / Document • ${COMMON_UPLOAD_LABEL}`} docType="tc" currentPath={data.tcPath} onUpload={onUpload} onPreview={onPreview} accept={COMMON_UPLOAD_ACCEPT} disabled={disabled} />
      <UploadBox label="Community Cert." subLabel={`Optional for OC • ${COMMON_UPLOAD_LABEL}`} docType="community" currentPath={data.communityPath} onUpload={onUpload} onPreview={onPreview} accept={COMMON_UPLOAD_ACCEPT} disabled={disabled} />
    </div>
    <div className="p-6 bg-slate-50 border border-slate-200 rounded">
      <div className="flex gap-4">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 mt-1"><Check size={18} strokeWidth={3} /></div>
        <div>
          <h5 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-2">Applicant Declaration</h5>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            I hereby solemnly declare that the facts given in this application are true to the best of my knowledge and belief. I understand that any false statement will disqualify me from the admission process and lead to immediate cancellation of my candidacy.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};

const UploadBox = ({ label, subLabel, docType, currentPath, onUpload, onPreview, accept, disabled }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const MIN_FILE_SIZE = 150 * 1024;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleChange = async (e) => {
    if (disabled) return;
    const file = e.target.files[0];
    if (!file) return;
    if (file.size < MIN_FILE_SIZE) { toast.error('File size should be at least 150KB'); return; }
    if (file.size > MAX_FILE_SIZE) { toast.error('File size exceeds 5MB'); return; }
    setUploading(true);
    await onUpload(file, docType);
    setUploading(false);
  };

  const isImage = currentPath && currentPath.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <div className="group relative">
      <div 
        onClick={() => !uploading && !disabled && !currentPath && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all min-h-40 overflow-hidden relative
          ${disabled ? 'cursor-not-allowed opacity-50 bg-slate-50' : !currentPath ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/50' : 'bg-white'}
          ${currentPath ? 'border-emerald-500 shadow-sm' : 'border-slate-200 bg-slate-50/50'}`}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} disabled={disabled} />

        {/* Background Preview (Subtle) */}
        {isImage && (
          <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none">
            <img src={currentPath} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}

        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); if (currentPath) onPreview(currentPath); else if (!uploading && !disabled) inputRef.current?.click(); }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 z-10 group/icon
          ${currentPath ? 'bg-white text-blue-600 shadow-xl border-2 border-blue-50 hover:scale-110 active:scale-95' : 'bg-white border border-slate-200 text-slate-300 shadow-sm'}`}
        >
          {uploading ? <Loader size={20} className="animate-spin" /> : currentPath ? <Eye size={22} strokeWidth={3} /> : <Upload size={20} />}
        </button>

        <div className="text-center z-10">
          <p className={`font-black text-xs tracking-tight transition-colors ${currentPath ? 'text-slate-800' : 'text-slate-600'}`}>{label}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1.5">{subLabel}</p>
        </div>

        {currentPath && (
          <div className="flex items-center gap-1.5 z-10">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Document Secured</p>
          </div>
        )}

        {/* Action Overlay (Professional View/Replace) */}
        {currentPath && !uploading && !disabled && (
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-20 px-4">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreview(currentPath); }}
              className="w-full py-2 bg-white text-blue-950 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-xl"
            >
              <Eye size={14} /> View Document
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="w-full py-2 bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-xl border border-blue-600"
            >
              <RefreshCw size={12} /> Replace File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- CUTE PREVIEW MODAL ---
const PreviewModal = ({ url, onClose }) => {
  const isImage = url?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-blue-950/40 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] relative z-10 flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Eye size={18} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Document Preview</p>
              <h4 className="text-sm font-black text-blue-950 uppercase tracking-tighter mt-1">Verification View</h4>
            </div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-slate-50 p-6 flex items-center justify-center min-h-100">
          {isImage ? (
            <img src={url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
          ) : (
            <iframe src={url} className="w-full h-full min-h-[60vh] border-none rounded-lg shadow-lg" title="Document PDF" />
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="px-8 py-2.5 bg-blue-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-900 transition-all"
          >
            Finished Viewing
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// NEW DYNAMIC COMPONENTS
// ─────────────────────────────────────────────────────────

const EducationHistory = ({ eduHistory, setEduHistory, onDistrictChange, master, disabled }) => {
  const addRow = () => {
    if (disabled) return;
    setEduHistory([...eduHistory, { standard: "", school: "", year: "", state: "Tamil Nadu", district: "" }]);
  };

  const removeRow = (index) => {
    if (disabled || eduHistory.length <= 1) return;
    setEduHistory(eduHistory.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    if (disabled) return;
    const newHistory = [...eduHistory];
    newHistory[index][field] = value;
    setEduHistory(newHistory);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Progression (6th - 12th)</h4>
        {!disabled && (
          <button type="button" onClick={addRow} className="text-[9px] font-bold bg-blue-600 text-white px-3 py-1 rounded uppercase tracking-wider hover:bg-blue-700 transition-colors">
            + Add Row
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-300 rounded-lg bg-slate-50/30">
        <table className="w-full text-left border-collapse min-w-150">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="px-4 py-2 text-[10px] font-bold text-slate-800 border-r border-slate-300">Standard</th>
              <th className="px-4 py-2 text-[10px] font-bold text-slate-800 border-r border-slate-300">School Name</th>
              <th className="px-4 py-2 text-[10px] font-bold text-slate-800 border-r border-slate-300">Year of Passing</th>
              <th className="px-4 py-2 text-[10px] font-bold text-slate-800 border-r border-slate-300">District</th>
              <th className="px-4 py-2 text-[10px] font-bold text-slate-800 border-r border-slate-300">State</th>
              {!disabled && <th className="px-4 py-2 text-[10px] font-bold text-slate-800 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {eduHistory.map((row, idx) => (
              <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 border-r border-slate-200">
                  <select value={row.standard} onChange={(e) => updateRow(idx, 'standard', e.target.value)} disabled={disabled} className="w-full text-xs font-bold border-none bg-transparent focus:ring-0">
                    {['6', '7', '8', '9', '10', '11', '12'].map(s => <option key={s} value={s}>{s}th</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 border-r border-slate-200">
                  <input type="text" value={row.school} onChange={(e) => updateRow(idx, 'school', e.target.value)} disabled={disabled} className="w-full text-xs font-bold border-none bg-transparent focus:ring-0" placeholder="School Name" />
                </td>
                <td className="px-4 py-2 border-r border-slate-200">
                  <input type="text" value={row.year} onChange={(e) => updateRow(idx, 'year', e.target.value)} disabled={disabled} className="w-full text-xs font-bold border-none bg-transparent focus:ring-0" placeholder="YYYY" />
                </td>
                <td className="px-4 py-2 border-r border-slate-200">
                  <select value={row.district} onChange={(e) => onDistrictChange(idx, e.target.value)} disabled={disabled} className="w-full text-xs font-bold border-none bg-transparent focus:ring-0">
                    <option value="">Select District</option>
                    {master?.districts?.map(d => {
                      const name = d.district_name || d.name;
                      return <option key={d.id || name} value={name}>{name}</option>;
                    })}
                  </select>
                </td>
                <td className="px-4 py-2 border-r border-slate-200">
                  <input type="text" value={row.state} readOnly disabled={disabled} className="w-full text-xs font-bold border-none bg-transparent focus:ring-0 text-slate-400" placeholder="State" />
                </td>
                {!disabled && (
                  <td className="px-4 py-2 text-center">
                    <button type="button" onClick={() => removeRow(idx)} disabled={eduHistory.length <= 1} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EducationSelector = ({ selectedType, setQualifyingType, tabConfig, disabled }) => {
  const tabs = (tabConfig && tabConfig.length ? tabConfig : MARK_TAB_ORDER.map(type => ({ type, enabled: true })));
  const gridClass = 'grid-cols-2 md:grid-cols-4';
  return (
    <div className={`grid gap-3 mb-8 ${gridClass}`}>
      {tabs.map(({ type, enabled }) => (
        <button
          key={type}
          type="button"
          disabled={disabled || !enabled}
          onClick={() => enabled && setQualifyingType(type.toLowerCase())}
          className={`px-4 py-3 rounded border font-bold text-xs uppercase tracking-widest transition-all
            ${!enabled
              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
              : selectedType === type.toLowerCase()
              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-100'
              : 'bg-slate-50 text-slate-500 border-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600'}`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

const AttemptManager = ({ type, attempts, setAttempts, selectedAttempts, setSelectedAttempts, disabled }) => {
  const typeKey = type.toUpperCase();
  const currentSelected = selectedAttempts[typeKey] || [];
  const currentCount = currentSelected.length;

  const setAttemptCount = (count) => {
    if (disabled) return;
    const nextSelected = count > 0 ? Array.from({ length: count }, (_, i) => i + 1) : [];
    setSelectedAttempts({ ...selectedAttempts, [typeKey]: nextSelected });
  };

  const updateAttemptData = (id, field, value) => {
    if (disabled) return;
    const typeAtts = attempts[typeKey] || {};
    setAttempts({
      ...attempts,
      [typeKey]: {
        ...typeAtts,
        [id]: { ...(typeAtts[id] || {}), [field]: value }
      }
    });
  };

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mark Attempt Tracking</h4>
          <p className="text-xs text-slate-600 font-medium italic mt-1">Optional. Choose how many attempts you want to enter. Leave it blank if there are no attempts to report.</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(id => (
            <label key={id} className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-all ${currentCount === id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-blue-300 hover:bg-blue-50/50'}`}>
              <input type="radio" name={`${typeKey}-attempt-count`} checked={currentCount === id} onChange={() => setAttemptCount(id)} disabled={disabled} className="hidden" />
              <span className="text-[10px] font-black uppercase">Att {id}</span>
            </label>
          ))}
          {currentCount > 0 && !disabled && (
            <button
              type="button"
              onClick={() => setAttemptCount(0)}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-red-300 hover:text-red-600 transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {currentSelected.length > 0 && (
      <div className="space-y-4">
        {currentSelected.map(id => (
          <div key={id} className="p-6 border border-slate-200 rounded-lg bg-slate-50/30">
            <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[8px]">{id}</span>
              Details for Attempt {id}
            </h5>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              <FormField label="Register Number" layout="horizontal">
                <input type="text" value={attempts[type.toUpperCase()]?.[id]?.registerNo || ''} onChange={e => updateAttemptData(id, 'registerNo', e.target.value)} disabled={disabled} className="text-sm font-bold" placeholder="Exam Register No" />
              </FormField>
              <FormField label="Marksheet No" layout="horizontal">
                <input type="text" value={attempts[type.toUpperCase()]?.[id]?.marksheetNo || ''} onChange={e => updateAttemptData(id, 'marksheetNo', e.target.value)} disabled={disabled} className="text-sm font-bold" placeholder="Marksheet Serial No" />
              </FormField>
              <FormField label="Exam Month" layout="horizontal">
                <select value={attempts[type.toUpperCase()]?.[id]?.month || ''} onChange={e => updateAttemptData(id, 'month', e.target.value)} disabled={disabled} className="text-sm font-bold">
                  <option value="">Select Month</option>
                  {['March', 'April', 'May', 'June', 'September', 'October'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Exam Year" layout="horizontal">
                <input type="text" value={attempts[type.toUpperCase()]?.[id]?.year || ''} onChange={e => updateAttemptData(id, 'year', e.target.value)} disabled={disabled} maxLength={4} className="text-sm font-bold" placeholder="YYYY" />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Total Marks Obtained" layout="horizontal">
                  <input type="text" value={attempts[type.toUpperCase()]?.[id]?.totalMatch || ''} onChange={e => updateAttemptData(id, 'totalMatch', e.target.value)} disabled={disabled} className="text-sm font-bold text-blue-600" placeholder="Enter total marks" />
                </FormField>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

const MarksTable = ({ type, data, setData, disabled }) => {
  const config = SUBJECT_CONFIG[type?.toUpperCase()] || { count: 0, subjects: [] };

  const updateMark = (idx, field, value) => {
    if (disabled) return;
    const typeKey = type?.toUpperCase();
    const typeMarks = data[typeKey] || { subjects: [] };
    const newSubjects = [...typeMarks.subjects];

    // Ensure all previous subjects are filled with defaults if they don't exist
    for (let i = 0; i <= idx; i++) {
      if (!newSubjects[i]) {
        newSubjects[i] = {
          name: config.subjects[i] || `Subject ${i + 1}`,
          obtained: '',
          max: '100'
        };
      }
    }

    if (field === 'obtained') {
      // Allow only digits
      const cleanValue = value.replace(/\D/g, '');
      const maxLimit = Number(newSubjects[idx].max) || 100;

      // Cap at max mark
      if (Number(cleanValue) > maxLimit) {
        newSubjects[idx].obtained = '';
      } else {
        newSubjects[idx].obtained = cleanValue;
      }
    } else {
      newSubjects[idx][field] = value;
    }

    setData({ ...data, [typeKey]: { ...typeMarks, subjects: newSubjects } });
  };

  // Robust Calculation: sum up all possible subjects from config
  const typeKey = type?.toUpperCase();
  const typeMarks = data[typeKey] || { subjects: [] };

  const totalObt = config.subjects.reduce((sum, _, idx) => {
    const s = typeMarks.subjects[idx];
    return sum + (Number(s?.obtained) || 0);
  }, 0);

  const totalMax = config.subjects.length * 100;
  const percentage = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto border border-slate-300 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest border-r border-slate-300">Subject</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center border-r border-slate-300">Marks Obtained</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Max Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {config.subjects.map((name, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 text-xs font-bold text-slate-700 border-r border-slate-300">{name}</td>
                <td className="px-6 py-4 text-center border-r border-slate-300">
                  <input type="number"
                    value={typeMarks.subjects[idx]?.obtained || ''}
                    onChange={e => updateMark(idx, 'obtained', e.target.value)}
                    disabled={disabled}
                    className="w-24 mx-auto block text-center font-bold text-blue-600 bg-white border border-slate-300 rounded py-2 px-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none shadow-sm" placeholder="0" />
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="w-20 mx-auto bg-slate-50 border border-slate-200 rounded py-1.5 px-2 text-sm font-black text-slate-400 select-none">
                    100
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Total Calculated</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{totalObt} <span className="text-xs font-bold text-slate-400">/ {totalMax}</span></p>
          </div>
        </div>
        <div className="p-6 border-2 border-blue-600 rounded-lg bg-blue-50 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Percentage Aggregate</p>
            <p className="text-2xl font-black text-blue-800 tracking-tight">{percentage} %</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
