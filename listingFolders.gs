function addingMissingFolders(SHARED_DRIVE_ID, SheetName ) {
  const sharedDrive = DriveApp.getFolderById(SHARED_DRIVE_ID);
  const folders = sharedDrive.getFolders();
  const folderRows = [];

  //folders in drive saved by name and id
  if (folders && folders.hasNext()) {

    do{ 
      const folder = folders.next();

      folderRows.push(
        [folder.getName(),
        folder.getId(), '', '', '', '', '', '', '', ''])

    }while(folders.hasNext())
  }

  //existing dictionary
  var accessSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var permissionsSheet = accessSpreadsheet.getSheetByName(SheetName);
  var permissionsData = permissionsSheet.getDataRange().getValues();
  var existingData = {};

  const headers = ['Folder Name', 'Folder ID', 'Group A' , 'Group B' , 'Group C', 'Client as Viewer', 'No Access',  'Addition Exceptions - Content Managers', 'Addition Exceptions - Viewers', 'Status'];
  var headerRange = permissionsSheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setWrap(true);
  headerRange.setBackground('#bdf2ce');
  permissionsSheet.setColumnWidth(1,190);


  for (var i=1 ;  i<permissionsData.length; i++){
    var oldRow = permissionsData[i];
    var key = oldRow[1];
    existingData[key] = oldRow;
  }

  Logger.log(folderRows);


const newRows = folderRows.filter(row => !existingData[row[1]])
                          .map(row => {
                            const folder = DriveApp.getFolderById(row[1]);
                            const contributors = folder.getEditors().map(ed => ed.getEmail().toLowerCase()).join(' , ');
                            const commenters = folder.getViewers().map(vw => vw.getEmail().toLowerCase()).join(' , ');
                            return [row[0], row[1], '', '', '', '', '', contributors, commenters, ''];
                          });


  Logger.log(newRows);

  if (newRows && newRows.length > 0) {
    Logger.log(permissionsData.length);
    var newRange = permissionsSheet.getRange(permissionsData.length + 1,1, newRows.length, 10);
    newRange.setValues(newRows);
    newCheckboxes = permissionsSheet.getRange(permissionsData.length+1, 3, newRows.length, 3);
    newCheckboxes.insertCheckboxes();

  }
  sortSheetAlphabetically(SheetName);
  for (var i = 1; i <= headers.length; i++) {
    permissionsSheet.autoResizeColumn(i);
    colWidth = permissionsSheet.getColumnWidth(i);
    permissionsSheet.setColumnWidth(i, Math.max(colWidth + 5, 100));

  }
}

function sortSheetAlphabetically(SheetName) {
  var rows = [];
  var accessSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = accessSpreadsheet.getSheetByName(SheetName);

  rows = (sheet.getDataRange().getValues().slice(1));
  const range = sheet.getRange(2, 1, rows.length, 10);
  range.clear();
  rows.sort(function (a, b) {
    return a[0].toLowerCase() > b[0].toLowerCase() ? 1 : -1;

  });
  Logger.log('rows: ' + rows);
  Logger.log('range: ' + range)

  range.setValues(rows);
}



function removeDeletedFolders(driveId, sheetName) {
    //iterate through the different drives and sheetnames listed in the 'drives' sheet
    const sharedDrive = DriveApp.getFolderById(driveId);
    const activeFolders = sharedDrive.getFolders();
    var activeFolderIds = [];
  
    do{
      const folder = activeFolders.next();
      Logger.log(folder.getId())
      activeFolderIds.push(folder.getId()); //contains the valid folders that are within the given drive
    }while(activeFolders.hasNext());
  
    Logger.log('here' + activeFolderIds);
    Logger.log('length' + activeFolderIds.length)
    //deletes invalid folder from sheet if it does not appear in the matching drive anymore
    var worksheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var folderData = worksheet.getDataRange().getValues();
    
    for (i=folderData.length; i>1; i--){
      Logger.log(folderData[i-1][1])
      if (!activeFolderIds.includes(folderData[i-1][1])){
        worksheet.deleteRow(i);
      }
    } 
  }
  