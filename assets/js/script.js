let app = {
    //apiUrl: 'http://10.81.5.72:3000/',
    apiUrl: 'http://localhost:3000/',


    init: function() {
        console.log('init');
        // Global variables
        let lines;
        let serverIP;
        let fileInput;
        let fileExtension;
        let rows;
        let serverID = 0;
        let serverList = [];
        let regex;
        let method;
        let cells;
        let location;
        let currentTarget;
        // Reading by default the Local Storage after refreshing the page, if LocalStorage is set it will check the servers already entered instead of displaying the homepage
        app.readLocalStorage();
        
        //Bind events
        $('#check').click(app.checkTextareaEvent);
        $('#file-js input[type=file]').change(app.checkCsvEvent);
        $('#check-csv').click(app.readCsvEvent);
    },
    // Processed while clicking on the "Check" button of the textarea
    checkTextareaEvent : function(evt) {
        let data = $('.textarea').val();
        app.method = 'checkTextareaEvent';

        if (data) {
            // Process data & update DOM
            app.currentTarget = $(evt.currentTarget);
            app.rows = data.split('\n');
            app.addTableToDOM();
            app.setLocalStorage();
      }
    },
    // Processed while loading a file in the csv file upload input
    checkCsvEvent : function() {
        app.fileInput = document.querySelector('#file-js input[type=file]');
        let button = document.querySelector('#check-csv');
                if (app.fileInput.files.length > 0) {
                let fileName = document.querySelector('#file-js .file-name');
                fileName.textContent = app.fileInput.files[0].name;

                let re = /(?:\.([^.]+))?$/;
                app.fileExtension = re.exec(app.fileInput.files[0].name)[1];

                if (app.fileExtension !== 'csv') {
                    button.disabled = true;
                    alert('File with extension ' + app.fileExtension + ' is not allowed to be upload')
                }
                else {
                    button.disabled = false;
                }
            }
    },
    // Processed while clicking on the "Check" button of the csv file upload area
    readCsvEvent : function(evt) {
        if (app.fileExtension == 'csv')
           app.currentTarget = $(evt.currentTarget);
        {
            if (typeof (FileReader) != "undefined") {
                var reader = new FileReader();
                reader.onload = function (e) {
                app.rows = e.target.result.split("\n");
                app.method = 'readCsvEvent';
                app.regex = /"/g;
                app.addTableToDOM();
                app.setLocalStorage();
            }
                reader.readAsText($(".file-input")[0].files[0]);
            } else {
                alert("This browser does not support HTML5.");
            }
        }
    },
    // Sending request to the backend : POST request -> (/CheckPorts)
    sendAjaxRequest : function() {
        $.ajax(
            {
                url: app.apiUrl + 'checkPorts' , 
                method: 'POST', 
                dataType: 'json', 
                data: { 
                id: app.serverID,
                ip: app.serverIP
                }
            }
            ).done(
            function(response) {
                let total = 0;
                let infos = '';
                let mandatoryPorts = 0;
                // Checking if mandatoryPorts 22 & 25 are opened
                for (var i = 0; i < response['ports'].length; i++) 
                {
                    // Checking all ports opened
                    $.each(response['ports'][i], function( index, value ){
                       
                        if (value === 'up')
                        {
                            total += 1;
                        }    

                        if (((index == 22) || (index == 25) && value == 'up')) 
                        {
                            mandatoryPorts += 1;
                        }                  
                    });
                }
                // Case : Server is up, 2 ports opened but not all mandatoryPorts
                if (mandatoryPorts != 2 && total == 2 && response['status'] != 'down') {
                    element = $('tr[server-id="'+ response['id'] + '"]');
                    element.addClass('has-background-warning');
                    element.addClass('color-b');
                    element.find('.status').html('CHECK (' + total + ')' 
                    + '<div class="tooltip ml-1">'
                    +    '<i class="fas fa-question-circle"></i>'
                    +   '<div class="top">'
                    +    '<h3>' + total + ' ports opened, but NOT 22 & 25, please check' 
                    +    '</h3>'
                    +   '</div>' 
                    + '</div>');
                }
                // Case : Server is up but not all mandatoryPorts are opened or less/more ports are opened
                 else if (( mandatoryPorts != 2 && total != 2 || mandatoryPorts == 2 && total != 2) && response['status'] != 'down') {
                    element = $('tr[server-id="'+ response['id'] + '"]');
                    element.addClass('has-background-warning');
                    element.addClass('color-b');
                    element.find('.status').html('CHECK (' + total + '/2)' 
                    + '<div class="tooltip ml-1">'
                    +    '<i class="fas fa-question-circle"></i>'
                    +   '<div class="top">'
                    +    '<h3>' + total + ' ports opened instead of 2, please check' 
                    +    '</h3>'
                    +   '</div>' 
                    + '</div>');
                }
                // Case : Server is up and only mandatoryPorts are opened
                else if (total == 2 && mandatoryPorts == 2)
                {
                    element = $('tr[server-id="'+ response['id'] + '"]');
                    element.addClass('has-background-success');
                    element.addClass('color-b');
                    element.find('.status').html('RUNNING (2/2)');
                }
                // Case : Server doesn't answer to ping
                else if (response['status'] == 'down') {
                    element = $('tr[server-id="'+ response['id'] + '"]');
                    element.addClass('has-background-danger');
                    element.addClass('color-b');
                    element.find('.status').html('DOWN'
                    + '<div class="tooltip ml-1">'
                    +    '<i class="fas fa-question-circle"></i>'
                    +   '<div class="top">'
                    +    '<h3> Server is down, please check' 
                    +    '</h3>'
                    +   '</div>' 
                    + '</div>');
                }
            }
            ).fail(
            function() {
                
            }
            );
    },
    setLocalStorage : function() {
        if (app.serverList.length > 0) {
            localStorage.setItem("shredderList", JSON.stringify(app.serverList));
            let timestamp = Math.floor(Date.now() / 1000);
            let expiredTime = (timestamp + (60*60*8));
            localStorage.setItem("expiredTime", JSON.stringify(expiredTime));

            if (JSON.parse(localStorage.getItem("shredderList")) != undefined && JSON.parse(localStorage.getItem("expiredTime")) != undefined) {
                $.growl.notice({ message: "Session started, expires at " + new Date(expiredTime*1000).toLocaleString() });
                app.addResetButton();
            }
    }
    },
    readLocalStorage : function() {
        if (JSON.parse(localStorage.getItem("expiredTime")) != undefined)
        {
            let currentTimestamp = Math.floor(Date.now() / 1000);
            let expiredTime = JSON.parse(localStorage.getItem("expiredTime"));
            
            if (currentTimestamp > expiredTime) {
                app.deleteLocalStorage();
            }
        }
        // LocalStorage already set
        if (localStorage.getItem("shredderList") != null)
        {   
            app.addResetButton();
            let serversInfos = JSON.parse(localStorage.getItem("shredderList"))
            app.rows = serversInfos;
            app.method = 'readLocalStorage';
            app.addTableToDOM();
        }
        // LocalStorage not set, displaying home page
        else {
           $('.list').html(
             '<div class="top-info is-size-6">'
            +  '<p>'
            +    '<i class="fas fa-info-circle mt-1 mr-1"></i>'
            +      'Copy/paste list from the <a class="underline" href="https://tools.privatnetz.org/sm/lists/shredderserver" target="_blank">shredder list</a>'
            +  '</p>'
            + '</div>'
            +  '<p class="subtitle mt-3">'
            +    '<textarea name="data" class="textarea" placeholder="Server list"></textarea>'
            +  '</p>'
            +  '<button id="check" class="button is-success">Check</button>'
            +    '<hr class="solid">'
            +  '<div class="top-info is-size-6">'
            +    '<p>'
            +        '<i class="fas fa-info-circle mt-1 mr-1"></i>'
            +        'Check via csv file upload'
            +    '</p>'
            +  '</div>'
            +  '<div id="file-js" class="file has-name mt-3">'
            +   '<label class="file-label">'
            +     '<input class="file-input" type="file" name="resume">'
            +     '<span class="file-cta">'
            +     '<span class="file-icon">'
            +        '<i class="fas fa-upload"></i>'
            +     '</span>'
            +     '<span class="file-label">'
            +        'Choose a file…'
            +     '</span>'
            +     '</span>'
            +     '<span class="file-name">'
            +      'No file uploaded'
            +     '</span>'
            +    '</label>'
            +   '<button id="check-csv" class="button is-success ml-1" disabled>Check</button>'
            +'</div>'
           );
        }
        
    },
    deleteLocalStorage : function() {
        $("#reset").addClass('is-loading');
        localStorage.clear();
        location.reload();
    },
    // Process all valid IP addresses and display results in the page
    addTableToDOM : function() {
        let serverList = [];
        let roomList = [];
        let id = 0;
        let errors = '';
        // Cleaning and splitting the rows providing from textarea
        for (i = 0; i < (app.rows).length; i++) {
            if (app.method == 'checkTextareaEvent') {
                app.rows[i] = app.rows[i].replace("ui-button", "");
                app.cells = app.rows[i].split('\t');
                app.location = app.cells[2];
            }
            // Split the rows providing from the csv file
            else if (app.method == 'readCsvEvent') {
                app.cells = app.rows[i].split(",");

                for (k=0; k < (app.cells).length; k++) {
                    app.cells[k] = app.cells[k].replace(app.regex, "");
                }

                app.location = app.cells[2];
            }
            else {
                // Split the rows from LocalStorage
                app.cells = app.rows[i];
                app.location = app.rows[i][2];
            }

            if (app.location != undefined) {
                app.location = app.location.split('/');
            }

            app.serverIP = app.cells[5];
            // Checking if IP is valid (also checked in the backend)
            let checkIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(app.serverIP);

            if (app.cells.length > 1 && checkIP == true && app.location[0] == 'SXB') {
                if (app.currentTarget != undefined) {
                (app.currentTarget).addClass('is-loading');
                }
                
                // Checking the room from the current row
                let room = app.cells[2];
                room = room.split('/');
                room = room[2] + '.' + room[3];
                
                let checkV = room.split('.');
                if (checkV[0] == 'V') {
                    room = 'VDS';
                }

                // Check if the room already exist in the array
                let roomExist = roomList.find(function (element) {
                    return element == room;
                });

                if (roomExist == undefined) {
                    roomList.push(room);
                }

                serverList.push(app.cells);    
            }

            app.serverList = serverList;

            if (checkIP != true && app.cells.length > 1 && app.method != 'readCsvEvent') {
                errors += "Invalid IP address line "+ i + '<br>';
            }
        }

        // Creating the tables in DOM
        $('.list').html('');
        // Sorting tables
        serverList.sort(function(a,b) {
            return a[2] > b[2] ? 1 : -1;
        });
        roomList.sort();

        roomList.each(function( element ) { 
            if (element == 'VDS') {
                room = '';
            }
            else {
                room = 'Room';
            }
            $('.list').append(
                '<div class="column processing overflow is-full" room="' + element + '">'
            +    '<div class="is-size-4">'room + element + '</div>'
            +    '<table room="' + element + '" class="table is-scrollable shredder-list is-stripped has-text-centered">'
            +     '<thead>'
            +      '<tr>'
            +       '<th><abbr title="Server name">Server name</abbr></th>'
            +       '<th><abbr title="Template">Template</abbr></th>'
            +       '<th><abbr title="Location">Location</abbr></th>'
            +       '<th><abbr title="Switch/Port">Switch/Port</abbr></th>'
            +       '<th><abbr title="Main IP Net">Main IP Net</abbr></th>'
            +       '<th><abbr title="Main IP">Main IP</abbr></th>'
            +       '<th><abbr title="Status">Status</abbr></th>'
            +      '</tr>'
            +     '</thead>')    
        );

        // Preapare rows & Ajax requests
        for (let i=0; i < serverList.length; ++i) {
                let room = serverList[i][2];
                room = room.split('/');
                room = room[2] + '.' + room[3];
            
                let checkV = room.split('.');
                if (checkV[0] == 'V') {
                    room = 'VDS';
                }

                app.serverID = parseInt(id) + 1;
                app.serverIP = serverList[i][5];
                id = parseInt(id) + 1;
                let row = '<tr server-id="'+ app.serverID + '">';

                for (var j = 0; j < 6; j++) {
                    row += ('<td>' + serverList[i][j] + '</td>');
                }
                row += (
                        '<td class="status">'
                    +   '<button class="button t no-border is-loading">Loading</button>'
                    +   '</td>'
                    +  '</tr>');

                element = $('table[room="'+ room + '"]');

                $(element).append(row);
                app.sendAjaxRequest();
        }

        if (errors.length > 0) {
            $.growl.warning({ message: errors });
        }
    },
    addResetButton : function() {
        $('.title').after(    
            '<p>'
          +  '<span class="has-text-success is-vcentered pl-3">'
          +     '<button id="reset" class="button is-small is-danger is-outlined">'
          +        '<span class="icon">'
          +            '<i class="fas fa-times"></i>'
          +        '</span>'
          +       '<span>Reset list</span>'
          +     '</button>'
          + '</p>'
      );

      $('#reset').click(app.deleteLocalStorage);
    }
};

$(app.init);
