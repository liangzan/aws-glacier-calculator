/**
 * Angular Controller for the calculator
 */
function GlacierCalculatorCtrl($scope) {
  $scope.retrieveJobHours = 4; // Amazon default
  $scope.calculate = function() {
    $scope.storageCost = glacierCalculator.storageCost($scope);
    $scope.retrievalCost = glacierCalculator.retrievalCost($scope);
    $scope.deletionCost = glacierCalculator.deletionCost($scope);
    $scope.transferCost = glacierCalculator.transferCost($scope);
    $scope.totalCost = $scope.storageCost +
      $scope.retrievalCost +
      $scope.transferCost +
      $scope.deletionCost;
  };
  $scope.retrievalTime = function() {
    if (typeof this.retrieveJobHours != 'undefined') {
      return Math.max(4, $scope.retrieveJobHours);
    } else {
      return 4;
    }
  }
}

/**
 * Glacier calculator
 */
var glacierCalculator = (function() {

  /**
   * Returns the storage rate for the region
   *
   * @private
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  function regionStorageRate(scope) {
    switch (scope.region) {
    case 'us-east-1': return 0.01;
    case 'us-west-1': return 0.01;
    case 'us-west-2': return 0.011;
    case 'eu-west-1': return 0.011;
    case 'eu-central-1': return 0.012;
    case 'ap-southeast-2': return 0.012;
    case 'ap-northeast-1': return 0.0114;
    default: return 0.01;
    }
  }

  /**
   * Returns the transfer rate for the region
   *
   * @private
   * @param {Object} scope - The Angular scope object
   * @param {String} tier - The tiers available
   * @return {Float}
   */
  function regionTransferRate(scope, tier) {
    if (scope.region === 'ap-southeast-2' || scope.region === 'ap-northeast-1') {
      switch (tier) {
      case '10tb': return 0.140;
      case '40tb': return 0.135;
      case '100tb': return 0.130;
      case '350tb': return 0.120;
      case 'max': return 0.120;
      default: return 0.140;
      }
    } else {
      switch (tier) {
      case '10tb': return 0.09;
      case '40tb': return 0.085;
      case '100tb': return 0.07;
      case '350tb': return 0.05;
      case 'max': return 0.05;
      default: return 0.09;
      }
    }
  }

  /**
   * Returns the deletion rate for the region
   *
   * @private
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  function regionDeletionRate(scope) {
    switch (scope.region) {
    case 'us-east-1': return 0.03;
    case 'us-west-1': return 0.03;
    case 'us-west-2': return 0.033;
    case 'eu-west-1': return 0.033;
    case 'eu-central-1': return 0.036;
    case 'ap-southeast-2': return 0.0342;
    case 'ap-northeast-1': return 0.036;
    default: return 0.03;
    }
  }

  /**
   * Returns the retrieval rate for the region
   *
   * @private
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  function regionRetrievalRate(scope) {
    switch (scope.region) {
    case 'us-east-1': return 0.01;
    case 'us-west-1': return 0.01;
    case 'us-west-2': return 0.011;
    case 'eu-west-1': return 0.011;
    case 'eu-central-1': return 0.012;
    case 'ap-southeast-2': return 0.0114;
    case 'ap-northeast-1': return 0.012;
    default: return 0.03;
    }
  }

  /**
   * Returns the peak hourly retrieval rate in GB
   *
   * @private
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  function peakHourlyRetrieval(scope) {
    if (typeof scope.retrieveData != 'undefined') {
      return scope.retrieveData / scope.retrievalTime();
    } else {
      return 0;
    }
  }

  /**
   * Returns the free hourly retrieval rate in GB
   *
   * @private
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  function freeHourlyRetrieval(scope) {
    if (typeof scope.storedData != 'undefined') {
      return (scope.storedData * 0.05) / (30 * Math.min(scope.retrievalTime(), 24));
    } else {
      return 0;
    }
  }

  /**
   * Returns the total transfer rate for the tier
   *
   * @private
   * @param {Object} scope - The Angular scope object
   * @param {Integer} data - The amount of data to transfer in GB
   * @param {String} tier - The tier
   * @return {Integer}
   */
  function rateForTier(scope, data, tier) {
    return regionTransferRate(scope, tier) * data;
  }

  /**
   * Returns the total data for the tier
   *
   * @private
   * @param {Integer} data - The amount of data to transfer in GB
   * @param {String} tierLimit - The tier limit
   * @return {Integer}
   */
  function dataForTier(data, tierLimit) {
    if (data > tierLimit) {
      return tierLimit;
    } else {
      return data;
    }
  }


  var cost = {};

  /**
   * Calculates the storage cost based on the region.
   *
   * @public
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  cost.storageCost = function(scope) {
    if (typeof scope.storedData != 'undefined' && typeof scope.storedDuration != 'undefined') {
      var durationInMonth = scope.storedDuration / 30;
      return regionStorageRate(scope) * scope.storedData * durationInMonth;
    } else {
      return 0;
    }
  };

  /**
   * Calculates the retrieval cost based on the region
   *
   * @public
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  cost.retrievalCost = function(scope) {
    if (typeof scope.retrieveData != 'undefined') {
      console.log("peak: " + peakHourlyRetrieval(scope));
      console.log("free: " + freeHourlyRetrieval(scope));
      var peakHourRetrievalData = peakHourlyRetrieval(scope) - freeHourlyRetrieval(scope);
      if (peakHourRetrievalData > 0) {
        return regionRetrievalRate(scope) * peakHourRetrievalData * 720;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  };

  /**
   * Calculates the deletion cost based on the region
   *
   * @public
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  cost.deletionCost = function(scope) {
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
  };

  /**
   * Calculates the transfer cost based on the region
   *
   * @public
   * @param {Object} scope - The Angular scope object
   * @return {Float}
   */
  cost.transferCost = function(scope) {
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
  };

  return cost;
}());
