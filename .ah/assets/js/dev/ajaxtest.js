



$(document).ready(function() {

    // On object select - display custom field or not
    $('#object_selector').change(function() {
		var val = $(this).val();
        $('#endpoint_test_url').val(val);
    });


    // API CALL
    $('#ajax_call_button').click(testCall);


    function testCall() {
        var endpoint = $('#endpoint_test_url').val();
        var baseUrl  = window.location.origin;         // Get current hostname

        $('#test_result_return_zone').hide();

        $.ajax({
            url: baseUrl + endpoint,
            dataType: 'json',
            cache: false,
            success: function (result) {

                $('#test_stream').html(result.talk.responseText)

                var jsonViewer = new JSONViewer();
                $('#test_uri_return').html(jsonViewer.getContainer());

                jsonViewer.showJSON(result, -1, -1);

            },
			error: function (result) {
			},
            complete: function () {
                $('#test_result_return_zone').show();
            }
        });

    }

});