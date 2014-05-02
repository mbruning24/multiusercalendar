var routeResolve = {
	authResolve: function($q, $location) {
		var defer = $q.defer(),
			simpleLogin = new FirebaseSimpleLogin(new Firebase('https://torid-fire-3667.firebaseio.com/'), function(error, user) {
				if (error) {
					$location.path('/login');
					defer.resolve(null);
				} else if (user) {
					defer.resolve(user);
				} else {
					$location.path('/login');
					defer.resolve(null);
				}
			});
		return defer.promise;
	}
}

angular.module('pclawcal', ['ngRoute', 'ngAnimate', 'firebase'])

.value('firebaseURL', 'https://torid-fire-3667.firebaseio.com/')
.value('fbApptsURL', 'https://torid-fire-3667.firebaseio.com/Appointments/')
.value('fbUsersURL', 'https://torid-fire-3667.firebaseio.com/Users/')

.factory('FBAppts', function($firebase, fbApptsURL) {
	return $firebase(new Firebase(fbApptsURL));
})
.factory('FBApptsRaw', function(fbApptsURL) {
	return new Firebase(fbApptsURL);
})
.factory('FBUsers', function($firebase, fbUsersURL) {
	return $firebase(new Firebase(fbUsersURL));
})
.factory('SelectedDate', function() {
	var today = new Date();
	var selDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	return {
		setSelDate: function(date) {
			selDate = date;
			return selDate;
		},
		getSelDate: function() {
			return selDate;
		}
	}
})
.factory('FBAuth', function($firebase, $firebaseSimpleLogin, firebaseURL) {
	return $firebaseSimpleLogin(new Firebase(firebaseURL));
})
.factory('CurrentUserAUL', function() {
	var cuaul = [];
	return {
		getCUAUL: function() {
			return cuaul;
		},
		setCUAUL: function(newCUAUL) {
			cuaul = newCUAUL;
			return cuaul;
		}
	}
})

.factory('UsersConversion', function(FBUsers) {
	var conversion = {};
	angular.forEach(FBUsers, function(value, key) {
		if (!angular.isFunction(value) && key != '$id') {
			conversion[key] = FBUsers.$child(key).firstName + ' ' + FBUsers.$child(key).lastName;
		}
	});
	return conversion;
})

.config( function($routeProvider) {
	$routeProvider
		.when('/', {
			controller:'CalendarCtrl',
			templateUrl:'calendar.html',
			resolve: routeResolve
		})
		.when('/users', {
			controller:'UsersCtrl',
			templateUrl:'users.html',
			resolve: routeResolve
		})
		.when('/settings', {
			controller:'SettingsCtrl',
			templateUrl:'settings.html',
			resolve: routeResolve
		})
		.when('/view-appt/:apptID', {
			controller:'ViewApptCtrl',
			templateUrl:'view-appt.html',
			resolve: routeResolve
		})
		.when('/edit-appt/:apptID', {
			controller:'EditApptCtrl',
			templateUrl:'edit-appt.html',
			resolve: routeResolve
		})
		.when('/add-appt', {
			controller:'AddApptCtrl',
			templateUrl:'add-appt.html',
			resolve: routeResolve
		})
		.when('/new-user', {
			controller:'NewUserCtrl',
			templateUrl:'new-user.html',
			resolve: routeResolve
		})
		.when('/login', {
			controller:'LoginCtrl',
			templateUrl:'login.html'
		})
		.otherwise({
			redirectTo:'/'
		});
})

.controller('CalendarCtrl', function($scope, $firebase, FBApptsRaw, SelectedDate, FBUsers, FBAuth, CurrentUserAUL) {

	$scope.pageClass = 'page-calendar';
	
	$scope.pickerDays = [
		{dayName: 'Sun'}, {dayName: 'Mon'}, {dayName: 'Tue'}, {dayName: 'Wed'}, {dayName: 'Thu'}, {dayName: 'Fri'}, {dayName: 'Sat'}
	];

	$scope.today = SelectedDate.getSelDate();
	
	$scope.curDay = new Date($scope.today.getFullYear(), $scope.today.getMonth(), $scope.today.getDate()); // Normalizes to midnight on current day.
	
	$scope.pickerMonth = new Date($scope.today.getFullYear(), $scope.today.getMonth(), 1);
	
	$scope.dates = buildDatesArray($scope.pickerMonth, $scope.curDay);
	
	$scope.pickerHeader = function() {
		return monthNames[$scope.pickerMonth.getMonth()] + ' ' + $scope.pickerMonth.getFullYear();
	}
	
	$scope.calendarHeader = buildHeader(SelectedDate.getSelDate());
	
	$scope.togglePicker = function() {
		toggleDatePicker();
	}
	
	$scope.backOneMonth = function() {
		$scope.pickerMonth = new Date($scope.pickerMonth.getFullYear(), $scope.pickerMonth.getMonth() - 1, 1);
		$scope.dates = buildDatesArray($scope.pickerMonth, $scope.curDay);
	}
	$scope.forwardOneMonth = function() {
		$scope.pickerMonth = new Date($scope.pickerMonth.getFullYear(), $scope.pickerMonth.getMonth() + 1, 1);
		$scope.dates = buildDatesArray($scope.pickerMonth, $scope.curDay);
	}
	
	$scope.loadNewDate = function(date) {
		$scope.calendarHeader = buildHeader(date);
		$scope.curDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()); //Normalized to midnight
		$scope.appts = $firebase(FBApptsRaw.startAt($scope.curDay.toISOString()).endAt(new Date($scope.curDay.getFullYear(), $scope.curDay.getMonth(), $scope.curDay.getDate(), 23, 59).toISOString()));
		SelectedDate.setSelDate($scope.curDay)
		$scope.dates = buildDatesArray($scope.pickerMonth, $scope.curDay);
	}
	
	$scope.goToToday = function() {
		var today = new Date();
		$scope.curDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		$scope.appts = $firebase(FBApptsRaw.startAt($scope.curDay.toISOString()).endAt(new Date($scope.curDay.getFullYear(), $scope.curDay.getMonth(), $scope.curDay.getDate(), 23, 59).toISOString()));
		SelectedDate.setSelDate($scope.curDay);
		$scope.calendarHeader = buildHeader(today);
		$scope.pickerMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		$scope.dates = buildDatesArray($scope.pickerMonth, $scope.curDay);
	}
	
	$scope.convertTime = function(date) {
		return getTimeFromDate(new Date(date));
	}
	
	//Loading appts requires FBAuth.$getCurrentUser()
	
	FBAuth.$getCurrentUser().then(function(user) {
		$scope.fbusers = FBUsers;
		$scope.cuID = parseInt(user.id);
		$scope.appts = $firebase(FBApptsRaw.startAt($scope.curDay.toISOString()).endAt(new Date($scope.curDay.getFullYear(), $scope.curDay.getMonth(), $scope.curDay.getDate(), 23, 59).toISOString()));
		var tempcuaul = CurrentUserAUL.setCUAUL($scope.fbusers.$child($scope.cuID).activeUsersList);
		$scope.cuaul = {};
		for (var i = 0; i < tempcuaul.length; i++) {
			$scope.cuaul[tempcuaul[i].id] = tempcuaul[i].active;
		}
		$scope.filterByUser = function(appt) {
			return $scope.cuaul[appt.uID];
		}
	});
})

.controller('AddApptCtrl', function($scope, $location, $timeout, FBAppts, FBUsers, UsersConversion) {
	$scope.pageClass = 'page-add-appt';

	$scope.fbappts = FBAppts;
	$scope.fbusers = FBUsers;
	$scope.usersConversion = UsersConversion;
	
	$scope.appt = {};
	
	$scope.addAppt = function() {
		
		if ($scope.appt.subject == undefined) { 
			alert('You Must Have a Name for this Appointment');
			return;
		}
		if ($scope.appt.username == undefined) { 
			alert('You Must Assign this Appointment to Somebody');
			return;
		}
		
		for (var i in $scope.usersConversion) {
			if ($scope.usersConversion[i] == $scope.appt.username) {
				$scope.appt.uID = parseInt(i);
			}
		}
		$scope.appt.$priority = $scope.appt.startDateTime.toISOString();
		$scope.fbappts.$add($scope.appt).then(function() {
			$timeout(function() { $location.path('/'); });
		});
	}
	
	$scope.toggleStartPicker = function() {
		toggleStartPicker();
	}
	$scope.toggleEndPicker = function() {
		toggleEndPicker();
	}
	
	var today = new Date();
	
	$scope.appt.startDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours() + 1);
	$scope.appt.endDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours() + 2);
	var startHeader = addApptHeader($scope.appt.startDateTime),
		endHeader = addApptHeader($scope.appt.endDateTime);
	$scope.startHead = {
		date: startHeader[0],
		time: startHeader[1]
	}
	$scope.endHead = {
		date: endHeader[0],
		time: endHeader[1]
	}
	
	$scope.$on('startDateTimeChange', function(event, datetime) {
		var n = addApptHeader(datetime);
		$scope.startHead = {
			date: n[0],
			time: n[1]
		}
		$scope.appt.startDateTime = datetime;
		if ($scope.appt.startDateTime >= $scope.appt.endDateTime) {
			$scope.appt.endDateTime = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() + 1, datetime.getMinutes());
			var startHeader = addApptHeader($scope.appt.startDateTime),
				endHeader = addApptHeader($scope.appt.endDateTime);
			$scope.startHead = {
				date: startHeader[0],
				time: startHeader[1]
			}
			$scope.endHead = {
				date: endHeader[0],
				time: endHeader[1]
			}
			//reset endpicker datetime
			$scope.$broadcast('EndTimeBroadcast', new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() + 1, datetime.getMinutes()));
		}
	});
	$scope.$on('endDateTimeChange', function(event, datetime) {
		var n = addApptHeader(datetime);
		$scope.endHead = {
			date: n[0],
			time: n[1]
		}
		$scope.appt.endDateTime = datetime;
		if ($scope.appt.endDateTime <= $scope.appt.startDateTime) {
			$scope.appt.startDateTime = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() - 1, datetime.getMinutes());
			var startHeader = addApptHeader($scope.appt.startDateTime),
				endHeader = addApptHeader($scope.appt.endDateTime);
			$scope.startHead = {
				date: startHeader[0],
				time: startHeader[1]
			}
			$scope.endHead = {
				date: endHeader[0],
				time: endHeader[1]
			}
			//Reset startPicker Datetime
			$scope.$broadcast('StartTimeBroadcast', new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() - 1, datetime.getMinutes()));
		}
	});
})

//Appt Picker Controllers
.controller('ApptStartPickerCtrl', function($scope) {
	var t = new Date();
	
	$scope.pickerDays = [
		{dayName: 'Sun'}, {dayName: 'Mon'}, {dayName: 'Tue'}, {dayName: 'Wed'}, {dayName: 'Thu'}, {dayName: 'Fri'}, {dayName: 'Sat'}
	];
	
	//scope vars
	$scope.curDateTime = new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours() + 1)
	
	$scope.curHour = ($scope.curDateTime.getHours() < 13 ? $scope.curDateTime.getHours() : $scope.curDateTime.getHours() - 12);
	if ($scope.curDateTime.getHours() == 0) { $scope.curHour = 12; }
	$scope.curMin = ($scope.curDateTime.getMinutes() < 10 ? '0' + $scope.curDateTime.getMinutes() : $scope.curDateTime.getMinutes());
	$scope.curPP = ($scope.curDateTime.getHours() < 12 ? 'AM':'PM');
	$scope.curMonth = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), 1);
	$scope.curMonthDisplay = monthNames[$scope.curDateTime.getMonth()] + ' ' + $scope.curDateTime.getFullYear();
	$scope.datesArray = buildDatesArray($scope.curMonth);
	
	//vars update function
	$scope.updateVars = function(newDate) {
		$scope.curHour = (newDate.getHours() < 13 ? newDate.getHours() : newDate.getHours() - 12);
		if (newDate.getHours() == 0) { $scope.curHour = 12; }
		$scope.curMin = (newDate.getMinutes() < 10 ? '0' + newDate.getMinutes() : newDate.getMinutes());
		$scope.curPP = (newDate.getHours() < 12 ? 'AM':'PM');
	}
	
	//scope funcs
	$scope.minusHour = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours() - 1, $scope.curDateTime.getMinutes());
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.plusHour = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours() + 1, $scope.curDateTime.getMinutes());
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.minusMin = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours(), $scope.curDateTime.getMinutes() - 30);
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.plusMin = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours(), $scope.curDateTime.getMinutes() + 30);
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.changePP = function() {
		//No Functionality Yet
	}
	$scope.upMonth = function() {
		$scope.curMonth = new Date($scope.curMonth.getFullYear(), $scope.curMonth.getMonth() - 1, 1);
		$scope.curMonthDisplay = monthNames[$scope.curMonth.getMonth()] + ' ' + $scope.curMonth.getFullYear();
		$scope.datesArray = buildDatesArray($scope.curMonth);
	}
	$scope.downMonth = function() {
		$scope.curMonth = new Date($scope.curMonth.getFullYear(), $scope.curMonth.getMonth() + 1, 1);
		$scope.curMonthDisplay = monthNames[$scope.curMonth.getMonth()] + ' ' + $scope.curMonth.getFullYear();
		$scope.datesArray = buildDatesArray($scope.curMonth);
	}
	$scope.selectDate = function(date) {
		$scope.curDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), $scope.curDateTime.getHours(), $scope.curDateTime.getMinutes());
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.datetimeChange = function() {
		$scope.$emit('startDateTimeChange', $scope.curDateTime);
	}
	
	$scope.$on('StartTimeBroadcast', function(event, datetime) {
		$scope.curDateTime = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours(), datetime.getMinutes());
		$scope.updateVars(datetime);
	});
})
.controller('endPickerCtrl', function($scope) {
	
	var t = new Date();
	
	$scope.pickerDays = [
		{dayName: 'Sun'}, {dayName: 'Mon'}, {dayName: 'Tue'}, {dayName: 'Wed'}, {dayName: 'Thu'}, {dayName: 'Fri'}, {dayName: 'Sat'}
	];
	
	//scope vars
	$scope.curDateTime = new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours() + 2)
	
	$scope.curHour = ($scope.curDateTime.getHours() < 13 ? $scope.curDateTime.getHours() : $scope.curDateTime.getHours() - 12);
	if ($scope.curDateTime.getHours() == 0) { $scope.curHour = 12; }
	$scope.curMin = ($scope.curDateTime.getMinutes() < 10 ? '0' + $scope.curDateTime.getMinutes() : $scope.curDateTime.getMinutes());
	$scope.curPP = ($scope.curDateTime.getHours() < 12 ? 'AM':'PM');
	$scope.curMonth = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), 1);
	$scope.curMonthDisplay = monthNames[$scope.curDateTime.getMonth()] + ' ' + $scope.curDateTime.getFullYear();
	$scope.datesArray = buildDatesArray($scope.curMonth);
	
	//vars update function
	$scope.updateVars = function(newDate) {
		$scope.curHour = (newDate.getHours() < 13 ? newDate.getHours() : newDate.getHours() - 12);
		if (newDate.getHours() == 0) { $scope.curHour = 12; }
		$scope.curMin = (newDate.getMinutes() < 10 ? '0' + newDate.getMinutes() : newDate.getMinutes());
		$scope.curPP = (newDate.getHours() < 12 ? 'AM':'PM');
	}
	
	//scope funcs
	$scope.minusHour = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours() - 1, $scope.curDateTime.getMinutes());
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.plusHour = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours() + 1, $scope.curDateTime.getMinutes());
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.minusMin = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours(), $scope.curDateTime.getMinutes() - 30);
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.plusMin = function() {
		$scope.curDateTime = new Date($scope.curDateTime.getFullYear(), $scope.curDateTime.getMonth(), $scope.curDateTime.getDate(), $scope.curDateTime.getHours(), $scope.curDateTime.getMinutes() + 30);
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.changePP = function() {
		//No Functionality Yet
	}
	$scope.upMonth = function() {
		$scope.curMonth = new Date($scope.curMonth.getFullYear(), $scope.curMonth.getMonth() - 1, 1);
		$scope.curMonthDisplay = monthNames[$scope.curMonth.getMonth()] + ' ' + $scope.curMonth.getFullYear();
		$scope.datesArray = buildDatesArray($scope.curMonth);
	}
	$scope.downMonth = function() {
		$scope.curMonth = new Date($scope.curMonth.getFullYear(), $scope.curMonth.getMonth() + 1, 1);
		$scope.curMonthDisplay = monthNames[$scope.curMonth.getMonth()] + ' ' + $scope.curMonth.getFullYear();
		$scope.datesArray = buildDatesArray($scope.curMonth);
	}
	$scope.selectDate = function(date) {
		$scope.curDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), $scope.curDateTime.getHours(), $scope.curDateTime.getMinutes());
		$scope.updateVars($scope.curDateTime);
		$scope.datetimeChange();
	}
	$scope.datetimeChange = function() {
		$scope.$emit('endDateTimeChange', $scope.curDateTime);
	}
	
	$scope.$on('EndTimeBroadcast', function(event, datetime) {
		$scope.curDateTime = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours(), datetime.getMinutes());
		$scope.updateVars(datetime);
	});
})

.controller('ViewApptCtrl', function($scope, $location, $routeParams, $firebase, fbApptsURL) {
	$scope.pageClass = 'page-view-appt';
	
	var apptUrl = fbApptsURL + $routeParams.apptID;
	$scope.appt = $firebase(new Firebase(apptUrl));
	
	$scope.showDateTime = function(d) {
		var date = new Date(d);
		return dayNames[date.getDay()] + ', ' + monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + ' at ' + getTimeFromDate(date);
	}
})

.controller('EditApptCtrl', function($scope, $location, $routeParams, $firebase, fbApptsURL, $timeout, FBUsers, UsersConversion) {
	$scope.pageClass = 'page-edit-appt';
	$scope.fbusers = FBUsers;
	$scope.usersConversion = UsersConversion;
	var apptUrl = fbApptsURL + $routeParams.apptID;
	$scope.appt = $firebase(new Firebase(apptUrl));
	$scope.tempAppt = $scope.appt;
	$scope.tempAppt.startDateTime = new Date($scope.tempAppt.startDateTime);
	$scope.tempAppt.endDateTime = new Date($scope.tempAppt.endDateTime);
	$scope.toggleStartPicker = function() {
		toggleStartPicker();
	}
	$scope.toggleEndPicker = function() {
		toggleEndPicker();
	}
	
	var startHeader = addApptHeader(new Date($scope.tempAppt.startDateTime)),
		endHeader = addApptHeader(new Date($scope.tempAppt.endDateTime));
	$scope.startHead = {
		date: startHeader[0],
		time: startHeader[1]
	}
	$scope.endHead = {
		date: endHeader[0],
		time: endHeader[1]
	}
	
	$timeout(function() {
		$scope.$broadcast('StartTimeBroadcast', $scope.tempAppt.startDateTime);
		$scope.$broadcast('EndTimeBroadcast', $scope.tempAppt.endDateTime);
	});
	
	$scope.$on('startDateTimeChange', function(event, datetime) {
		var n = addApptHeader(datetime);
		$scope.startHead = {
			date: n[0],
			time: n[1]
		}
		$scope.appt.startDateTime = datetime;
		if ($scope.appt.startDateTime >= $scope.appt.endDateTime) {
			$scope.appt.endDateTime = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() + 1, datetime.getMinutes());
			var startHeader = addApptHeader($scope.appt.startDateTime),
				endHeader = addApptHeader($scope.appt.endDateTime);
			$scope.startHead = {
				date: startHeader[0],
				time: startHeader[1]
			}
			$scope.endHead = {
				date: endHeader[0],
				time: endHeader[1]
			}
			$scope.$broadcast('EndTimeBroadcast', new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() + 1, datetime.getMinutes()));
		}
	});
	$scope.$on('endDateTimeChange', function(event, datetime) {
		var n = addApptHeader(datetime);
		$scope.endHead = {
			date: n[0],
			time: n[1]
		}
		$scope.appt.endDateTime = datetime;
		if ($scope.appt.endDateTime <= $scope.appt.startDateTime) {
			$scope.appt.startDateTime = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() - 1, datetime.getMinutes());
			var startHeader = addApptHeader($scope.appt.startDateTime),
				endHeader = addApptHeader($scope.appt.endDateTime);
			$scope.startHead = {
				date: startHeader[0],
				time: startHeader[1]
			}
			$scope.endHead = {
				date: endHeader[0],
				time: endHeader[1]
			}
			$scope.$broadcast('StartTimeBroadcast', new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours() - 1, datetime.getMinutes()));
		}
	});
	
	$scope.saveAppt = function() {
		$scope.appt = $scope.tempAppt;
		for (var i in $scope.usersConversion) {
			if ($scope.usersConversion[i] == $scope.appt.username) {
				$scope.appt.uID = parseInt(i);
			}
		}
		$scope.appt.$priority = $scope.tempAppt.startDateTime.toISOString();
		$scope.appt.$save();
		$location.path('/');
	}
	$scope.delAppt = function() {
		if (confirm('Are You Sure You Want to Delete this Event?')) {
			$scope.appt.$remove();
			$location.path('/');
		}
	}
})

.controller('UsersCtrl', function($scope, $firebase, FBUsers, fbUsersURL, FBAuth) {
	$scope.pageClass = 'page-users';
	
	FBAuth.$getCurrentUser().then(function(user) {
		
		//Set scope var for cur user id
		$scope.cuID = parseInt(user.id);
		
		//Load users
		$scope.users = FBUsers;
		$scope.actives = {};
		
		//set actives
		var list = $scope.users.$child(user.id).activeUsersList;
		for (var i = 0; i < list.length; i++) {
			$scope.actives[list[i].id] = list[i].active;
		}
		
	});
	
	$scope.updateActivesAndPush = function() {
		if ($scope.cuID == null) { return; } //Make sure cuid was loaded
		//Replace activeUsersList in Firebase
		var pushList = [];
		for (var key in $scope.actives) {
			pushList.push({
				id: parseInt(key),
				active: $scope.actives[key]
			});
		}
		$scope.users.$child($scope.cuID).$update({activeUsersList: pushList });
	}
	
	$scope.showOnlyMe = function() {
		if ($scope.cuID == null) { return; } //Make sure cuid was loaded
		for (var ukey in $scope.actives) {
			$scope.actives[ukey] = false;
			$scope.actives[parseInt($scope.cuID)] = true;
		}
		var pushList = [];
		for (var key in $scope.actives) {
			pushList.push({
				id: parseInt(key),
				active: $scope.actives[key]
			});
		}
		$scope.users.$child($scope.cuID).$update({activeUsersList: pushList });
	}
	$scope.showAll = function() {
		if ($scope.cuID == null) { return; } //Make sure cuid was loaded
		for (var ukey in $scope.actives) {
			$scope.actives[ukey] = true;
		}
		var pushList = [];
		for (var key in $scope.actives) {
			pushList.push({
				id: parseInt(key),
				active: $scope.actives[key]
			});
		}
		$scope.users.$child($scope.cuID).$update({activeUsersList: pushList });
	}
})

.controller('NewUserCtrl', function($scope, $timeout, $location, FBUsers, FBAuth) {
	$scope.pageClass = 'page-new-user';
	
	$scope.users = FBUsers;
	$scope.auth = FBAuth;
	
	$scope.addUser = function() {
		if ($scope.firstName == '') {alert('First Name Required.'); return;}
		if ($scope.lastName == '') {alert('Last Name Required.'); return;}
		if ($scope.userEmail == '') {alert('Email Address Required.'); return;}
		if ($scope.userPwd == '') {alert('Password Required.'); return;}
		if ($scope.userEmail != $scope.userEmailConf) {alert('Email Addresses Do Not Match.'); return;}
		if ($scope.userPwd != $scope.userPwdConf) {alert('Passwords Do Not Match.'); return;}
		
		$scope.auth.$createUser($scope.userEmail, $scope.userPwd).then( function(user) {
			
			//create new temp AUL
			tempAUL = [];
			angular.forEach($scope.users, function(value, key) {
				if (!angular.isFunction(value) && key != '$id') {
					tempAUL.push({
						id: key,
						active: true
					})
					//While we're here, update everyone else's AULs with the new user
					var list = $scope.users.$child(key).activeUsersList;
					list.push({
						id: parseInt(user.id),
						active: true
					});
					$scope.users.$child(key).$update({activeUsersList: list});
				}
			});
			tempAUL.push({ id: parseInt(user.id), active:true });
			
			//create new user id and stuff
			var newID = user.id;
			var newStuff = {
				firstName: $scope.firstName,
				lastName: $scope.lastName,
				activeUsersList: tempAUL
			};
			
			//Add user to users
			$scope.users.$child(newID).$set(newStuff);
			
			//Return to users page
			$timeout(function() { $location.path('/users'); });
			
		}, function(error) {
			alert('User Creation Failed: ' + error);
			return;
		});
	}
})

.controller('SettingsCtrl', function($scope, $timeout, $location, FBAuth, FBUsers) {
	$scope.pageClass = 'page-settings';
	
	$scope.hello = 'Hello, Settings World.';
	
	$scope.auth = FBAuth;
	
	$scope.showStuff = function() {
		console.log($scope.auth.user);
	}
	$scope.logoutUser = function() {
		FBAuth.$logout();
		$timeout(function() {
			$location.path('/login');
		});
	}
	
})
.controller('LoginCtrl', function($scope, $timeout, $location, $firebase, $firebaseSimpleLogin) {
	$scope.pageClass = 'page-login';
	
	$scope.loginUser = function() {
		var ref = 'https://torid-fire-3667.firebaseio.com/';
		var auth = $firebaseSimpleLogin(new Firebase(ref));
		auth.$login('password', {
			email: $scope.username,
			password: $scope.password,
			rememberMe: ($scope.rememberMe == true ? true:false)
		}).then(function(user) {
			$timeout( function() {
				$location.path('/');
			});
		}, function(error) {
			console.log('error: ', error);
		});
	}
});







