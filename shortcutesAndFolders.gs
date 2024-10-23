function addContentManager(folderId, email) {
  try {
    var permissionResource = {
      'role': 'fileOrganizer',  // role for content manager in shared drives
      'type': 'user',
      'value': email  
    };

    var additionalOptions = {
      'supportsAllDrives': true,
      'sendNotificationEmails': false       
    };
    Drive.Permissions.insert(permissionResource, folderId, additionalOptions);
    Logger.log('Added content manager: ' + email + ' to folder ID: ' + folderId);
  } catch (err) {
    Logger.log('Failed to add content manager: ' + err.message);
  }
}

function createUserFoldersAndShortcutsV2() {1
    const targetDriveId = '';  // ID of the target drive where you want to create folders
    Logger.log('here');
    const sourceDriveIds = getDriveData([0]).flat();
    Logger.log('these are the drives returned ' + sourceDriveIds);
  
  
    const targetDrive = DriveApp.getFolderById(targetDriveId);
    const contentManagerEmails = new Set();
  
    sourceDriveIds.forEach(sourceDriveId => {
      Logger.log(sourceDriveId);
      const sourceDrive = DriveApp.getFolderById(sourceDriveId);
      const folders = sourceDrive.getFolders();
  
      while (folders.hasNext()){
        const folder = folders.next();
        const contentManagers = folder.getEditors();
  
        contentManagers.forEach(user => {
          const email = user.getEmail().toLowerCase();
          contentManagerEmails.add(email);
        });
      }
    });
  
    // Create folders and shortcuts in the target drive
    contentManagerEmails.forEach(email => {
      const userName = getUserNameFromEmail(email);  // Extract name from email
  
      if (userName) {
        // Check if the folder already exists
        const existingFolder = findFolderByName(targetDrive, userName);
        let userFolder;
  
        if (!existingFolder) {
          userFolder = targetDrive.createFolder(userName);
          Logger.log(`Created folder for: ${userName}`);
        } else {
          userFolder = existingFolder;
          Logger.log(`Folder already exists for: ${userName}`);
  
        }
        if (userFolder) {
          const userFolderId = userFolder.getId();
          let collabsOrigEditors = userFolder.getEditors();
          var match = collabsOrigEditors.find(function (m) {
            return m.getEmail().toLowerCase() === email;
          })
          if(!match){
            addContentManager(userFolderId, email);
          }
          // For each source drive, create a folder named after the source drive if it doesn't exist
          sourceDriveIds.forEach(sourceDriveId => {
            //const sourceDriveName = DriveApp.getFolderById(sourceDriveId).getName();
            //var sourceDriveName = Drive.Drives.get(sourceDriveId).name;
            var response = Drive.Drives.get(sourceDriveId);
            var sourceDriveName = response.name;
   
            let sourceDriveFolder = findFolderByName(userFolder, sourceDriveName);
  
            if (!sourceDriveFolder) {
              sourceDriveFolder = userFolder.createFolder(sourceDriveName);
              Logger.log(`Created folder for source drive: ${sourceDriveName} in ${userName}'s folder`);
            } else {
              Logger.log(`Folder for source drive ${sourceDriveName} already exists in ${userName}'s folder`);
            }
  
            // Retrieve and create shortcuts to the folders that the user has permissions to within this source drive
            const userFolders = getUserFolders(DriveApp.getFolderById(sourceDriveId), email);
  
            if (userFolders.length > 0) {
              Logger.log(`Folders accessible by ${userName} in source drive ${sourceDriveName}:`);
              userFolders.forEach(folder => {
                Logger.log(`- ${folder.getName()} (ID: ${folder.getId()})`);
  
                try {
                  const shortcutName = folder.getName();
                  const shortcutID = folder.getId();
                  var existingFiles = sourceDriveFolder.getFilesByName(shortcutName);
                  var shortcutExists = false;
  
                  while (existingFiles.hasNext()) {
                    var file = existingFiles.next();
                    if (file.getMimeType() === MimeType.SHORTCUT) {
                      var targetshortcutId = DriveApp.getFileById(file.getId()).getTargetId();
                      if (targetshortcutId === shortcutID) {
                        shortcutExists = true;
                        break;
                      }
                    }
                  }
  
                  if (!shortcutExists) {
                    createFolderShortcut(folder, sourceDriveFolder);
                  }
                } catch (err) {
                  Logger.log(`Failed to create shortcut for folder ${folder.getName()} in ${sourceDriveName}: ${err.message}`);
                }
              });
  
              Logger.log('User folders for ' + userName + ' in source drive ' + sourceDriveName + ' are: ' + userFolders);
  
              deleteInvalidShortcuts(sourceDriveFolder, userFolders);
            } else {
              Logger.log(`No folders found for ${userName} in source drive ${sourceDriveName}`);
            }
          });
        }
      }
    });
  }

  
// to find a folder by name within a parent folder
function findFolderByName(parentFolder, name) {
    const folders = parentFolder.getFoldersByName(name);
    if (folders.hasNext()) {
      return folders.next();
    }
    return null;
  }
  
// to get folders a user has permissions to
function getUserFolders(sourceDrive, email) {
    const folders = [];
    const allFolders = sourceDrive.getFolders();
  
    while (allFolders.hasNext()) {
      const folder = allFolders.next();
      const editors = folder
        .getEditors()
        .map(user => user.getEmail().toLowerCase());
      const viewers = folder
        .getViewers()
        .map(user => user.getEmail().toLowerCase());
  
      if (editors.includes(email) || viewers.includes(email)) {
        folders.push(folder);
      }
    }
    return folders;
}
  
  // to extract name from email
function getUserNameFromEmail(email) {
    return email.split('@')[0];  // Return the part before '@'
}
  
// create a shortcut to a folder 
function createFolderShortcut(folder, parentFolder) {
    const folderId = folder.getId();
    const shortcutName = folder.getName();
    var shortcut = DriveApp.createShortcut(folderId).setName(shortcutName);
    parentFolder.addFile(shortcut);
}
  

//deleting invalid shortcuts
function deleteInvalidShortcuts(parentFolder, validFolders) {
    const validFolderIds = validFolders.map(folder => folder.getId());
    const existingFiles = parentFolder.getFiles();

    while (existingFiles.hasNext()) {
        const file = existingFiles.next();
        if (file.getMimeType() === MimeType.SHORTCUT) {
        const targetId = file.getTargetId();
        if (!validFolderIds.includes(targetId)) {
            Logger.log(`Deleting invalid shortcut: ${file.getName()}`);
            file.setTrashed(true);
        }
        }
    }
}