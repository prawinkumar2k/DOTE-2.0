const express = require('express');
const router = express.Router();
const { getMasterData, getCollegeList } = require('../controllers/master.controller');

router.get('/', getMasterData);
router.get('/colleges', getCollegeList);

module.exports = router;
