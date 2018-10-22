
var hCls = HxGetVar("hCls");          // get Socket-Handle

var oNewDSValues = {},
	sRc = 0,
	sServer = 'localhost',	// if it runs on localhost, otherwise ip or name of server
	sPort = '40015',		// database port (not http port!!!)
	sUser = 'admin',		// user name for login
	sPW = 'admin',			// password for login user
	linkDS = 'pLink',		// repeat Field for link to dataset
	linkProp = 'pValue',	// repeat Field for link propability
	chkStat = 'chkStat';	// check status for checked records; can be used for selections in further processes

var	oLogin = HxLogin(sServer, sPort, sUser, sPW);	// run login and store login handle in "oLogin"

var jsVar = [
  {
    "searchVal"     : {"v": [ { "m" : "+", "t" : "s", "f" : "chkStat", "w" : "*", "v" : ["1"]} ]}, 	// search records with 'chkStat' == 1; for example new imported records
    'fields'        : ['NameL', 'NameF', 'Street', 'HsNum', 'ZipCode', 'City'],	// compare fields from data record 1 (new records)
    'search_fields' : ['KANAML', 'KANAMF', 'KASTR', 'KAHNR', 'KAZIP', 'KACTY'],	// compare fields from data record 2 (old records); first field will be compared with first of "fields"; second with second and so on
    'weight'        : [50, 50, 50, 50, 50, 50],		// weight for each field -> relative ratio to each other - the sum is 100%
    "minNumEQfields": 3,  							// how many fields should be absolutely equal (deterministically)
    "minPercEQ"     : 85,      						// how many minimal points should have the score of the match? (max. 100; probabilistically)
    'linkField'     : '@pLink',		// link field for linking to same dataset (has to be repeat field)
    'linkProb'      : 'pValue',		// numeric result field for probabilistic evaluation (also repeat field; has to be in a repeat group with linkField in database)
    'strict'        : false			// true: stops linking if one link found with 100%; false: links also all records <100%
  }, 
  {
    "searchVal"     : {"v": [ { "m" : "+", "t" : "s", "f" : "#T", "w" : "*", "v" : ["PERS"]} ]},	// search all record from record type (#T) = PERS (for example all persons)
    'fields'        : ['Name', 'FNam', 'Str', 'zip', '?NorNam', '?PhonNN', '?NorOrt', '?NorZip', '?NorStr'],	// here are some reporter fields (the fields which begins with "?")
    'search_fields' : ['KANAM', 'KANAMF', 'KASTR', 'KAZIP', 'KAPTE', 'KAGTE', 'KAPMO', 'KAPFA', 'KAPML'],		// reporter field can be compared with "real" fields
    'weight'        : [50, 50, 50, 50, 30, 20, 15, 5, 10],
    "minNumEQfields": 5,
    "minPercEQ"     : 75,
    'linkField'     : '@pLink',
    'linkProb'      : 'pValue',
    'strict'        : false
  }
];

/* check login and break if rc != 0 */
if (oLogin.rc != 0) {
  print ("error on login to license DB. rc="+oLogin.rc);
  exit(-1);
}

var hCls = oLogin.hDb;       // get Socket-Handle from login


//cleanup -> delete all existing links
for(var part=0; part<jsVar.length; part++) {
  var searchVal = JSON.parse(JSON.stringify(jsVar[part]['searchVal']));						// search records
  searchVal.v.push({'m':'+', 't':'s', 'f':jsVar[part]['linkField'], 'w':'*', 'v':['*']});	// build search string
  var oRes = HxSelect(hCls, searchVal);														// run select with search string
  if(oRes.c != 0) {																			// if count of return > 0
    var aData = HxGetSynLstInh(hCls, oRes.iids, 10, ['!IID', {'s' : jsVar[part]['linkField'], 'f' : 'l'}], 1);	// get all link fields for each record
    for(var x=0; x<aData.length;x++) {														// run through all records
      var sIId = aData[x][0];																// get record IID
      var hCntUpdate = HxCtxCntCreate();													// reserve memory for record and delete values of link field and prob field
      for(var f=0; f<aData[x][1].length; f++) {	
        HxSetChar(hCntUpdate, jsVar[part]['linkField'], '', aData[x][1][f]['i']);
        if(jsVar[part]['linkProb'] !== '')
          HxSetChar(hCntUpdate, jsVar[part]['linkProb'], '', aData[x][1][f]['i']);
      }
      var iWriteRc = HxCtxCntUpdate(hCls, hCntUpdate, sIId, 10);							// update record
      if (iWriteRc != 0) {
        log2Cons(iWriteRc, 'Update error');
      }
      HxCtxCntFree(hCntUpdate);
    }
  }
}

/*
** returns size of object
*/
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/*
** getTimeStamp 	returns new timestamp
*/
function getTimeStamp() {
	var d = new Date();
	return d.toDateString();
}

/*
** log2Cons 	logs text to console
** parameter	errorcode and text
*/
function log2Cons(errorcode, text) {
	print(getTimeStamp() + ': ' + errorcode + "\t" + text + "\r\n");
}

/*
** writeLinkPropability 	writes calculated result to target data record
** parameter	db-handle, iid of target record, linked iid, propability result
*/
function writeLinkPropability(hCls, target, aLinks, linkField, linkProb, strict) {
  var hCntThis = HxCtxCntCreate();      				// new container in memory
  var bEqual = false;
  for(var l=0; l<aLinks.length; l++) {					// for each found link
    if(aLinks[l]['p'] < 100 && strict && bEqual)		// break if probability <100 and strict == true
      break;
    var sFid = HxGetNewFId(hCls);												// get new ID for repeat field
    HxSetLink(hCntThis, linkField, {'t':'@', 'i': aLinks[l]['i']}, sFid);		// set link field
    if(linkProb !== '')
      HxSetInt224(hCntThis, linkProb, aLinks[l]['p'], sFid);					// set probability for link
    if(aLinks[l]['p'] === 100)
      bEqual = true;
  }
  HxSetChar(hCntThis, chkStat, '5');											// status of record
  var iWriteRc = HxCtxCntUpdate(hCls, hCntThis, target, 10);					// update record
  if (iWriteRc != 0) {
    log2Cons(iWriteRc, 'Update error');
  }
  HxCtxCntFree(hCntThis);
}

/***
* Find datasets with 'searchVal' from jsVar and socket handle from hCls
***/
function getNewDataSets(searchVal) {
  log2Cons('0','get Datasets');
  var oRes = HxSelect(hCls, searchVal);
  log2Cons('0',oRes['c'] + ' IIDs found');

  return oRes;
}

/*
** readNewDataSets 	read new datasets and build array of search strings for each field in record
** parameter 	IID of record
** return 	object with search string for each field
*/
function readNewDataSets(sIId, part, aSearch, oRec) {

  var aSFields = ['!IID', '#T'];
      aSFields = aSFields.concat(part.fields);

  var aData = HxGetSynLstInh(hCls, [sIId], 10, aSFields, 0);
  oRec.iid = aData[0][0];
  oRec.dst = aData[0][1];
  oRec.fields = aData[0];
  oRec.fields.splice(0, 2);

  for(var f=0; f<part.fields.length; f++) {
    if(oRec.fields[f] === '')
      continue;
    var oBuff = {'m':'+', 't':'s', 'w':'!', 'f':part.search_fields[f], 'v':[oRec.fields[f]]};	// build search string
    aSearch.push(oBuff);
  }
}

function getDataset(part, sIId) {
  var aSFields = ['!IID', '#T'];
      aSFields = aSFields.concat(part.search_fields);

  var aData = HxGetSynLstInh(hCls, [sIId], 10, aSFields, 0);
  var oRec = {};
  oRec.iid = aData[0][0];
  oRec.dst = aData[0][1];
  oRec.fields = aData[0];
  oRec.fields.splice(0, 2);

  return oRec;
}

/*
*  Levenshtein string distance
*  source: https://gist.github.com/andrei-m/982927
*/
function levenshtein(a, b) {
  if(a.length == 0) return b.length;
  if(b.length == 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                       Math.min(matrix[i][j-1] + 1, // insertion
                       matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}



/*
**
**	begin script
**
*/
log2Cons('0', 'begin Script 1');

// find and get new datasets AND build search string for "HxSelect"
for(var part=0; part<jsVar.length; part++) {

  var aIIds = getNewDataSets(jsVar[part].searchVal),							// get new datasets
      oNewDSValues = {},
      aSearch = [],
      oRecData = {},
      oCntIID = {};

  if (aIIds.c > 0 ) {															// if count of found datasets > 0
    for (var i = 0; i < aIIds.c; i++) {
      var oCntIID = {};

      log2Cons('0',part + ' work on ' + aIIds.iids[i]);

      aSearch = [],
      oCntIID = {},
      oRecData ={};

      readNewDataSets(aIIds.iids[i], jsVar[part], aSearch, oRecData);

      var lMax = 0;
      for(var s=0; s<aSearch.length; s++) {
        var oRes = HxSelect(hCls, {'v':[aSearch[s]]});
        for(var j=0; j<oRes.c; j++) {
          if(typeof oCntIID[oRes.iids[j]] == 'undefined')
            oCntIID[oRes.iids[j]] = 0;
          oCntIID[oRes.iids[j]]++;
          lMax = Math.max(lMax, oCntIID[oRes.iids[j]]);
        }
      }
      if(lMax < jsVar[part].minNumEQfields)
        continue;

      var aWriteLink = [];
      for(var sCntIID in oCntIID) {
        if(oCntIID[sCntIID] < jsVar[part].minNumEQfields)
          continue;
        if(typeof oNewDSValues[sCntIID] == 'undefined') {
          oNewDSValues[sCntIID] = getDataset(jsVar[part], sCntIID);
        }
        var sumDSVal = 0,
            sumWeight  = 0;
        for(var f=0; f<jsVar[part].fields.length; f++) {
          var field = jsVar[part].fields[f],
              b = oRecData.fields[f],
              a = oNewDSValues[sCntIID].fields[f],
              tmpRes = 0;
          if (b != '') {
            var tmpRes =  (1 - (a.length / 100 * levenshtein(a, b))) * jsVar[part].weight[f];
          }
          sumDSVal += tmpRes;
          sumWeight += jsVar[part].weight[f];
        }
        var retResult = Math.round(100 / sumWeight * sumDSVal);
        if(retResult >= jsVar[part].minPercEQ && aIIds.iids[i] != sCntIID) {
          aWriteLink.push({'i':sCntIID, 'p':retResult});
        }
      }

      if(aWriteLink.length != 0) {
        aWriteLink.sort(function(a, b) {return b.p-a.p;});
        writeLinkPropability(hCls, aIIds.iids[i], aWriteLink, jsVar[part].linkField, jsVar[part].linkProb, jsVar[part]['strict'] || false);
      }
    }
  }
}

log2Cons('0', 'end Script 1 (RecLink)');
