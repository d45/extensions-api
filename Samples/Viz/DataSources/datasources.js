'use strict';

// Wrap everything in an anonymous function to avoid polluting the global namespace
(function () {
  $(document).ready(function () {
    tableau.extensions.initializeAsync().then(function () {
      // Maps dataSource id to dataSource so we can keep track of unique dataSources.
      const worksheetDataSources = {};

      // To get dataSource info, first get the worksheet.
      const worksheet = tableau.extensions.worksheetContent.worksheet;

      worksheet.getDataSourcesAsync().then(function (dataSourcesForWorksheet) {
        dataSourcesForWorksheet.forEach(function (dataSource) {
          if (!worksheetDataSources[dataSource.id]) { // We've already seen it, skip it.
            worksheetDataSources[dataSource.id] = dataSource;
          }
        });

        buildDataSourcesTable(worksheetDataSources);

        // This just modifies the UI by removing the loading banner and showing the dataSources table.
        $('#loading').addClass('hidden');
        $('#dataSourcesTable').removeClass('hidden').addClass('show');
      });
    }, function (err) {
      // Something went wrong in initialization.
      console.log('Error while Initializing: ' + err.toString());
    });
  });

  // Refreshes the given dataSource.
  function refreshDataSource (dataSource) {
    dataSource.refreshAsync().then(function () {
      console.log(dataSource.name + ': Refreshed Successfully');
    });
  }

  // Displays a modal dialog with more details about the given dataSource.
  function showModal (dataSource) {
    const modal = $('#infoModal');

    $('#nameDetail').text(dataSource.name);
    $('#idDetail').text(dataSource.id);
    $('#typeDetail').text((dataSource.isExtract) ? 'Extract' : 'Live');

    // Loop through every field in the dataSource and concat it to a string.
    let fieldNamesStr = '';
    dataSource.fields.forEach(function (field) {
      fieldNamesStr += field.name + ', ';
    });

    // Slice off the last ", " for formatting.
    $('#fieldsDetail').text(fieldNamesStr.slice(0, -2));

    dataSource.getConnectionSummariesAsync().then(function (connectionSummaries) {
      // Loop through each connection summary and list the connection's
      // name and type in the info field
      let connectionsStr = '';
      connectionSummaries.forEach(function (summary) {
        connectionsStr += summary.name + ': ' + summary.type + ', ';
      });

      // Slice of the last ", " for formatting.
      $('#connectionsDetail').text(connectionsStr.slice(0, -2));
    });

    dataSource.getActiveTablesAsync().then(function (activeTables) {
      // Loop through each table that was used in creating this datasource
      let tableStr = '';
      activeTables.forEach(function (table) {
        tableStr += table.name + ', ';
      });

      // Slice of the last ", " for formatting.
      $('#activeTablesDetail').text(tableStr.slice(0, -2));
    });

    modal.modal('show');
  }

  // Constructs UI that displays all the dataSources in this worksheet
  // given a mapping from dataSourceId to dataSource objects.
  function buildDataSourcesTable (dataSources) {
    // Clear the table first.
    $('#dataSourcesTable > tbody tr').remove();
    const dataSourcesTable = $('#dataSourcesTable > tbody')[0];

    // Add an entry to the dataSources table for each dataSource.
    for (const dataSourceId in dataSources) {
      const dataSource = dataSources[dataSourceId];

      const newRow = dataSourcesTable.insertRow(dataSourcesTable.rows.length);
      const nameCell = newRow.insertCell(0);
      const refreshCell = newRow.insertCell(1);
      const infoCell = newRow.insertCell(2);

      const refreshButton = document.createElement('button');
      refreshButton.innerHTML = ('Refresh Now');
      refreshButton.type = 'button';
      refreshButton.className = 'btn btn-primary';
      refreshButton.addEventListener('click', function () { refreshDataSource(dataSource); });

      const infoSpan = document.createElement('span');
      infoSpan.className = 'glyphicon glyphicon-info-sign';
      infoSpan.addEventListener('click', function () { showModal(dataSource); });

      nameCell.innerHTML = dataSource.name;
      refreshCell.appendChild(refreshButton);
      infoCell.appendChild(infoSpan);
    }
  }
})();
