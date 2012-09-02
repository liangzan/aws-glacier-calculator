function GlacierCalculatorCtrl($scope) {
  $scope.calculate = function() {
    $scope.storageCost = storageCost($scope);
    $scope.retrievalCost = retrievalCost($scope);
    $scope.deletionCost = deletionCost($scope);
    $scope.transferCost = transferCost($scope);
    $scope.totalCost = $scope.storageCost +
      $scope.retrievalCost +
      $scope.transferCost +
      $scope.deletionCost;
  };
}

/**
 * Calculates the storage cost based on the region.
 * Assumes 1 month == 30 days
 *
 * @public
 * @param {Object} scope - The Angular scope object
 * @return {Float}
 */
function storageCost(scope) {
  if (typeof scope.storedData != 'undefined' && typeof scope.storedDuration != 'undefined') {
    var durationInMonth = scope.storedDuration / 30;
    return regionStorageRate(scope) * (scope.storedData / durationInMonth);
  } else {
    return 0;
  }
  return (scope.storedData * scope.storedDuration) || 0;
}

function retrievalCost(scope) {
  if (typeof scope.retrieveData != 'undefined' && typeof scope.bandwidth != 'undefined') {
    scope.retrieveDuration = (scope.retrieveData * 1000) / scope.bandwidth;
    if (scope.retrieveData > freeRetrievalData(scope)) {
      var peakHourRetrievalData = peakHourlyRetrieval(scope) - freeHourlyRetrieval(scope);
      return regionRetrievalRate(scope) * peakHourRetrievalData * retrievalDurationInHours(scope);
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}

function regionRetrievalRate(scope) {
  switch (scope.region) {
  case 'us-east': return 0.01;
  case 'us-west-1': return 0.01;
  case 'us-west-2': return 0.011;
  case 'europe': return 0.011;
  case 'asia': return 0.012;
  default: return 0.01;
  }
}

function peakHourlyRetrieval(scope) {
  if (typeof scope.bandwidth != 'undefined') {
    return (scope.bandwidth / 1000) * 60 * 60;
  } else {
    return 0;
  }
}

function freeHourlyRetrieval(scope) {
  if (typeof scope.storedData != 'undefined') {
    return (scope.storedData * 0.05) / (30 * 24);
  } else {
    return 0;
  }
}

function freeRetrievalData(scope) {
  if (typeof scope.storedData != 'undefined') {
    return 0.05 * scope.storedData;
  } else {
    return 0;
  }
}

function retrievalDurationInHours(scope) {
  if (typeof scope.retrieveDuration != 'undefined') {
    var hoursDivider = 60 * 60;
    return (scope.retrieveDuration - (scope.retrieveDuration % hoursDivider)) / hoursDivider;
  } else {
    return 0;
  }
}

function retrievalDurationInDays(scope) {
  if (typeof scope.retrieveDuration != 'undefined') {
    var daysDivider = 60 * 60 * 24;
    return (scope.retrieveDuration - (scope.retrieveDuration % daysDivider)) / daysDivider;
  } else {
    return 0;
  }
}

function deletionCost(scope) {
  if (typeof scope.deletedData != 'undefined' && typeof scope.deletedDuration != 'undefined') {
    if (scope.deletedDuration < 30) {
      return scope.deletedData * regionDeletionRate(scope) * 3;
    } else if (scope.deletedDuration < 60) {
      return scope.deletedData * regionDeletionRate(scope) * 2;
    } else if (scope.deletedDuration < 90) {
      return scope.deletedData * regionDeletionRate(scope);
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}

function regionDeletionRate(scope) {
  switch (scope.region) {
  case 'us-east': return 0.01;
  case 'us-west-1': return 0.01;
  case 'us-west-2': return 0.011;
  case 'europe': return 0.011;
  case 'asia': return 0.012;
  default: return 0.01;
  }
}

function transferCost(scope) {
  if (typeof scope.retrieveData != 'undefined') {
    var currentData = scope.retrieveData - 1;
    var tenTBTierData = dataForTier(currentData, 10000);
    currentData = currentData - tenTBTierData;
    var fortyTBTierData = dataForTier(currentData, 40000);
    currentData = currentData - fortyTBTierData;
    var hundredTBTierData = dataForTier(currentData, 100000);
    currentData = currentData - hundredTBTierData;
    var threeFiftyTBTierData = dataForTier(currentData, 350000);
    currentData = currentData - threeFiftyTBTierData;
    var maxTierData = currentData;

    return rateForTier(scope, tenTBTierData, '10tb') +
      rateForTier(scope, fortyTBTierData, '40tb') +
      rateForTier(scope, hundredTBTierData, '100tb') +
      rateForTier(scope, threeFiftyTBTierData, '350tb') +
      rateForTier(scope, maxTierData, 'max');
  } else {
    return 0;
  }
}

function rateForTier(scope, data, tier) {
  return regionTransferRate(scope, tier) * data;
}

function dataForTier(data, tierLimit) {
  if (data > tierLimit) {
    return tierLimit;
  } else {
    return data;
  }
}

function regionStorageRate(scope) {
  switch (scope.region) {
  case 'us-east': return 0.01;
  case 'us-west-1': return 0.01;
  case 'us-west-2': return 0.011;
  case 'europe': return 0.011;
  case 'asia': return 0.012;
  default: return 0.01;
  }
}

function regionTransferRate(scope, tier) {
  if (scope.region == 'asia') {
    switch (tier) {
    case '10tb': return 0.201;
    case '40tb': return 0.158;
    case '100tb': return 0.137;
    case '350tb': return 0.127;
    case 'max': return 0.127;
    default: return 0.201;
    }
  } else {
    switch (tier) {
    case '10tb': return 0.12;
      case '40tb': return 0.09;
      case '100tb': return 0.07;
      case '350tb': return 0.05;
      case 'max': return 0.05;
      default: return 0.12;
    }
  }
}

angular.module('GlacierCalculatorModule', []).
  filter('days', function() {
    return function(input) {
      var daysDivider = 60 * 60 * 24;
      var hoursDivider = 60 * 60;
      var minutesDivider = 60;

      var output = '';
      var currentInput = input;

      if (currentInput > daysDivider) {
	var daysTaken = (currentInput - (currentInput % daysDivider)) / daysDivider;
	currentInput = currentInput % daysDivider;
	output += daysTaken + ' days';
      }

      if (currentInput > hoursDivider) {
	var hoursTaken = (currentInput - (currentInput % hoursDivider)) / hoursDivider;
	currentInput = currentInput % hoursDivider;
	if (output.length > 0) { output += ' '; }
	output += hoursTaken + ' hours';
      }

      if (currentInput > minutesDivider) {
	var minutesTaken = (currentInput - (currentInput % minutesDivider)) / minutesDivider;
	currentInput = currentInput % minutesDivider;
	if (output.length > 0) { output += ' '; }
	output += minutesTaken + ' minutes';
      }

      if (currentInput > 0) {
	if (output.length > 0) { output += ' '; }
	output += currentInput + ' seconds';
      }

      return output;
    };
  });