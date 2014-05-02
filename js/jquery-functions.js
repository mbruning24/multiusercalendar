// On Load, set the date variables
var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	keysForAddingAppts = ['subject', 'location', 'startDateTime', 'endDateTime', 'user', 'notes'];

function toggleDatePicker() {
	if ($('.datepicker').hasClass('collapsed')) {
		//Show Datepicker
		$('.datepicker').slideDown(400, function() {
			$('.datepicker').removeClass('collapsed');
			$('.cal-toggle').removeClass('glyphicon-calendar');
			$('.cal-toggle').addClass('glyphicon-chevron-up');
		});
		//Animate margins
		$('.calendar-appts').animate({'margin-top':'356px'}, 400);
	} else {
		//Hide Datepicker
		$('.datepicker').slideUp(400, function() {
			$('.datepicker').addClass('collapsed');
			$('.cal-toggle').removeClass('glyphicon-chevron-up');
			$('.cal-toggle').addClass('glyphicon-calendar');
		});
		$('.calendar-appts').animate({'margin-top':'61px'}, 400);
	}
}

function toggleStartPicker() {
	if ($('#startPicker').hasClass('collapsed')) {
		$('#startPicker').slideDown(400, function() {
			$('#startPicker').removeClass('collapsed');
		});
		//If end picker is showing, collapse endpicker
		if (!$('#endPicker').hasClass('collapsed')) {
			$('#endPicker').slideUp(100, function() {
				$('#endPicker').addClass('collapsed');
			});
		}
	} else {
		$('#startPicker').slideUp(400, function() {
			$('#startPicker').addClass('collapsed');
		});
	}
}
function toggleEndPicker() {
	if ($('#endPicker').hasClass('collapsed')) {
		$('#endPicker').slideDown(400, function() {
			$('#endPicker').removeClass('collapsed');
		});
		//If start picker is showing, collapse startpicker
		if (!$('#startPicker').hasClass('collapsed')) {
			$('#startPicker').slideUp(100, function() {
				$('#startPicker').addClass('collapsed');
			});
		}
	} else {
		$('#endPicker').slideUp(400, function() {
			$('#endPicker').addClass('collapsed');
		});
	}
}

function buildDatesArray(date, selDate) {
	var days = [],
		lastDay = (new Date(date.getFullYear(), date.getMonth() + 1, 0)).getDate(),
		firstWeekDay = date.getDay(),
		lastWeekDay = (new Date(date.getFullYear(), date.getMonth() + 1, 0)).getDay();
	for (var x = 1 - firstWeekDay; x <= 0; x++) {
		days.push({
			date: new Date(date.getFullYear(), date.getMonth(), x),
			dayNumber: (new Date(date.getFullYear(), date.getMonth(), x)).getDate(),
			dateClass: 'date-prev',
			isSelDate: (Date.parse(selDate) == Date.parse(new Date(date.getFullYear(), date.getMonth(), x)) ? true:false)
		});
	}
	for (var i = 1; i <= lastDay; i++) {
		days.push({
			date: new Date(date.getFullYear(), date.getMonth(), i),
			dayNumber: i,
			dateClass: '',
			isSelDate: (Date.parse(selDate) == Date.parse(new Date(date.getFullYear(), date.getMonth(), i)) ? true:false)
		});
	}
	for (var y = 1; y <= 6 - lastWeekDay; y++) {
		days.push({
			date: new Date(date.getFullYear(), date.getMonth() + 1, y),
			dayNumber: y,
			dateClass: 'date-next',
			isSelDate: (Date.parse(selDate) == Date.parse(new Date(date.getFullYear(), date.getMonth() + 1, y)) ? true:false)
		});
	}
	return days;
}

function buildHeader(date) {
	return { dayStr: dayNames[date.getDay()], dateStr: monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() }
}

function getTimeFromDate(date) {
	var hrs = (date.getHours() < 13 ? date.getHours() : date.getHours() - 12),
		mins = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()),
		PP = (date.getHours() < 12 ? 'AM':'PM');
	if (hrs == 0) { hrs = 12; }
	return hrs + ':' + mins + ' ' + PP;
}

function addApptHeader(date) {
	var d = dayNames[date.getDay()] + ' ' + monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear(),
		t = getTimeFromDate(date);
	return [d, t];
}





