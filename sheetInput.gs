function maintainingAndGrantingPermissions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  const userData = sheet.getDataRange().getValues();

  groupA = sheet.getRange(2,1,userData.length).getValues().flat();
  groupB = sheet.getRange(2,2,userData.length).getValues().flat();
  groupC = sheet.getRange(2,3,userData.length).getValues().flat();

  var groupAMembers = groupA.filter(function(element) {
    return element; // Returns true for non-empty elements
  });

  var groupBMembers = groupB.filter(function(element) {
    return element; // Returns true for non-empty elements
  });

  var groupCMembers = groupC.filter(function(element) {
    return element; // Returns true for non-empty elements
  });

  Logger.log(groupAMembers);
  Logger.log(groupBMembers);
  Logger.log(groupCMembers);

  return {
    groupAMembers,
    groupBMembers,
    groupCMembers
  };
}


function getTargetDriveID() {
  const worksheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Drives');
  const data = worksheet.getRange(2, 1, worksheet.getLastRow() - 1, worksheet.getLastColumn()).getValues();
  
  // Searching for the row where the sheet name is blank and the drive name is 'target drive'
  const targetDriveRow = data.find(row => row[1] === '' && row[2] === 'Target drive');
  
  return targetDriveRow[0]; 
}



function getDriveData(columns = [0, 1]) {
    const worksheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Drives');
    var data = worksheet.getRange(2, 1, worksheet.getLastRow() - 1, worksheet.getLastColumn()).getValues();
    let result = [];
  
    data = data.filter(row => row[2] !== 'target drive');

    data.forEach(row => {
      let rowData = columns.map(index => row[index]);
      result.push(rowData);
    });
  
    Logger.log('Result: ' + JSON.stringify(result));
    return result;
  }
  