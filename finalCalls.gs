function run(){
  const sheetInfo = getDriveData();
  sheetInfo.forEach((row)=>{
    let driveAccessID = row[0]
    let sheetAccess = row[1]
    removeDeletedFolders(driveAccessID, sheetAccess);
    addingMissingFolders(driveAccessID, sheetAccess);
  })
}

function runningFinal(){
    const sheetInfo = getDriveData();
    const targetDriveID = getTargetDriveID();

    sheetInfo.forEach((row)=>{
      let driveAccessID = row[0]
      let sheetAccess = row[1]
      Logger.log('this is the drive ' + driveAccessID);
      Logger.log('this is the sheet name ' + sheetAccess);
      addingMissingFolders(driveAccessID, sheetAccess);
      removeDeletedFolders(driveAccessID, sheetAccess);
      updatingPermissions(driveAccessID, sheetAccess);
    })
    createUserFoldersAndShortcutsV2(targetDriveID);
  }
  
  