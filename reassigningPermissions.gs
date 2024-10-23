function updatingPermissions(driveid, sheetname) {
  const clientTestDrive = DriveApp.getFolderById(driveid); //the clients folder inside of testDrive
  
  const folders = clientTestDrive.getFolders();
  const worksheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetname);
  const data = worksheet.getDataRange().getValues();

  const { groupAMembers, groupBMembers, groupCMembers } = maintainingAndGrantingPermissions();

  // Remove header row
  data.shift();

  if (folders && folders.hasNext()) {
    data.forEach(function(grantingAccess) {
      const folderId = grantingAccess[1];
      const folder = DriveApp.getFolderById(folderId);

      // Extract email lists and normalize to lowercase
      const noAccess = grantingAccess[6] ? normalizeEmails(grantingAccess[6].split(",")) : [];
      const clientAsViewer = grantingAccess[5] ? normalizeEmails(grantingAccess[5].split(",")) : [];
      const collabsOrigEditors = grantingAccess[7] ? normalizeEmails(grantingAccess[7].split(",")) : [];
      const collabsOrigViewers = grantingAccess[8] ? normalizeEmails(grantingAccess[8].split(",")) : [];

      Logger.log(`No Access List: ${noAccess}`);
      Logger.log(`Client As Viewer List: ${clientAsViewer}`);
      Logger.log(`Collabs Orig Editors List: ${collabsOrigEditors}`);
      Logger.log(`Collabs Orig Viewers List: ${collabsOrigViewers}`);

      // Revoke permissions for "No Access" users
      noAccess.forEach(email => {
        try {
          folder.revokePermissions(email);
          Logger.log(`Revoked permissions for: ${email}`);
        } catch (err) {
          Logger.log(`Failed to revoke permissions for ${email}: ${err.message}`);
        }
      });

      const existingContentMgr = folder.getEditors().map(function(user) {
        return user.getEmail().toLowerCase();
      });

      const existingViewer = folder.getViewers().map(function(user){
        return user.getEmail().toLowerCase();
      })

      Logger.log(`Existing Content Managers: ${existingContentMgr}`);
      Logger.log(`Existing Viewers: ${existingViewer}`);

      // Create a set of allowed members
      const allowedMembers = new Set();
      const allowedViewers = new Set();

      // Check conditions for adding members
      if (grantingAccess[2]) { // Group A
        const normalizedgroupAMembers = normalizeEmails(groupAMembers);
        Logger.log(`Group A Members to Check: ${normalizedgroupAMembers}`);
        normalizedMgroupAMembers.forEach(email => allowedMembers.add(email));
      }

      if (grantingAccess[3]) { // Group B
        const normalizedGroupBMembers = normalizeEmails(groupBMembers);
        Logger.log(`Group B Members to Check: ${normalizedGroupBMembers}`);
        normalizedGroupBMembers.forEach(email => allowedMembers.add(email));
      }

      if (grantingAccess[4]) { // Group C
        const normalizedGroupCMembers = normalizeEmails(groupCMembers);
        Logger.log(`Group C Members to Check: ${normalizedGroupCMembers}`);
        normalizedGroupCMembers.forEach(email => allowedMembers.add(email));
      }

      // Add members who should be granted access
      collabsOrigEditors.forEach(email => allowedMembers.add(email));
      collabsOrigViewers.forEach(email => allowedViewers.add(email));
      clientAsViewer.forEach(email => allowedViewers.add(email));

      Logger.log(`Allowed Members Set: ${Array.from(allowedMembers)}`);

      // Grant Content Manager access
      function grantContentManagerAccess(email) {
        Logger.log(`Attempting to grant Content Manager access to: ${email}`);
        if (!noAccess.includes(email) && !existingContentMgr.includes(email)) {
          try {
            addContentManager(folderId, email);
            Logger.log(`Granted Content Manager access to: ${email}`);
          } catch (err) {
            Logger.log(`Failed to grant Content Manager access to ${email}: ${err.message}`);
          }
        } else {
          Logger.log(`Skipping Content Manager access for: ${email} (either in 'No Access' or already has access)`);
        }
      }

      allowedMembers.forEach(email => {
        if (!existingContentMgr.includes(email)) {
          grantContentManagerAccess(email);
        }
      });

      // Grant Viewer access
      function grantViewerAccess(email) {
        Logger.log(`Attempting to grant Viewer access to: ${email}`);
        if (!noAccess.includes(email) && !existingViewer.includes(email)) {
          try {
            folder.addViewer(email);
            Logger.log(`Granted Viewer access to: ${email}`);
          } catch (err) {
            Logger.log(`Failed to grant Viewer access to ${email}: ${err.message}`);
          }
        } else {
          Logger.log(`Skipping Viewer access for: ${email} (either in 'No Access' or already has access)`);
        }
      }


      allowedViewers.forEach(email => {
          grantViewerAccess(email);
        }
      );
      // Remove access for users not in allowed groups
      const allPermissions = [...existingContentMgr, ...existingViewer];

      allPermissions.forEach(email => {
        if ((!allowedMembers.has(email) && !allowedViewers.has(email)) && !noAccess.includes(email)) {
          try {
            folder.revokePermissions(email);
            Logger.log(`Removed access for: ${email}`);
          } catch (err) {
            Logger.log(`Failed to remove access for ${email}: ${err.message}`);
          }
        } else {
          Logger.log(`Skipping removal of access for: ${email} (either in allowed groups or 'No Access')`);
        }
      });
    });
  }
}

function normalizeEmails(emails) {
  return emails.map(function(email) {
    return email.trim().toLowerCase();
  });
}