$(document).ready(function() {
    const socket = io.connect('http://localhost:8081');
    var field = $('#progress');
    var current_page = 0;

    socket.on('message', function(data) {
        field.text(data);
        /*
        if (data) {
            field
                .prop('number', field.text())
                .animateNumber({ number: data });
        } else {
            console.log('There is a problem:', data);
        }*/
    });

    var fillEvents = function() {
        $.get('/events/' + current_page, function(data) {
            $('#event-list tr').remove();
            var trHtml = '';
            data = JSON.parse(data);
            $.each(data, function(iter, item) {
                trHtml += '<tr><td>' + item.names + '</td><td>('
                + item.scores + ')</td><td>' + item.date_event + '</td></tr>';
            });
            $('#event-list').append(trHtml);
        });
    }

    var setPage = function(number) {
        current_page = number;
        $('#current-page').text(current_page);
        fillEvents();
    }

    var refreshDataSaved = function() {
        $.get('/events/saved', function(data) {
            $('#data-saved').text(data);
        });
    }

    $('#refresh').click(function() {
        $.get('/events/max_page', function(data) {
            if(current_page > data) {
                setPage(parseInt(data));
            } else {
                fillEvents();
            }
        });
        refreshDataSaved();
    });

    $('#left-page').click(function() {
        if(current_page > 0) {
            setPage(current_page-1);
        }
    });

    $('#right-page').click(function() {
        $.get('/events/max_page', function(data) {
            if(current_page < data) {
                setPage(current_page+1);
            } else {
                if(current_page > data) {
                    setPage(parseInt(data));
                }
            }
        });
    });

    $('#load-data').click(function() {
        $.post('/events').fail(function(data) {
            $('#error-load').text(data.responseText);
        });
    });

    $('#delete-rand').click(function() {
        $.ajax({
            url: '/events/' + $('#percent').val(),
            type: 'DELETE',
            success: function(result) {
                console.log(result);
            },
        });
    });

    fillEvents();
    refreshDataSaved();
});
