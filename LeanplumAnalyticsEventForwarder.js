/* eslint-disable no-undef */

//
//  Copyright 2017 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

(function (window) {
    var name = 'LeanplumAnalyticsEventForwarder',
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        };

    var constructor = function () {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            reportingService,
            isTesting;

        self.name = name;

        function processEvent(event) {
            var reportEvent = false;

            if (isInitialized) {
                try {
                    if (event.EventDataType === MessageType.PageView) {
                        reportEvent = logPageView(event);
                    }
                    else if (event.EventDataType === MessageType.Commerce) {
                        reportEvent = logPurchaseEvent(event);
                    }
                    else if (event.EventDataType === MessageType.PageEvent) {
                        reportEvent = logEvent(event);
                    }

                    if (reportEvent === true && reportingService) {
                        reportingService(self, event);
                        return 'Successfully sent to ' + name;
                    } else {
                        return 'Error logging event - ' + reportEvent.error;
                    }
                }
                catch (e) {
                    return 'Failed to send to: ' + name + ' ' + e;
                }
            }

            return 'Can\'t send to forwarder ' + name + ', not initialized';
        }

        function setUserIdentity(id, type) {
            if (isInitialized) {
                try {
                    if (type === window.mParticle.IdentityType.CustomerId || type === window.mParticle.IdentityType.Email) {
                        Leanplum.setUserId(id);
                    }
                    else {
                        return 'User Identity type not supported on forwarder ' + name + '. Use only CustomerId or Email';
                    }
                }
                catch (e) {
                    return 'Failed to call setUserIdentity on ' + name + ' ' + e;
                }
            }
            else {
                return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
            }
        }

        function setUserAttribute(key, value) {
            if (isInitialized) {
                try {
                    var attributeDict = {};
                    attributeDict[key] = value;
                    Leanplum.setUserAttributes(attributeDict);

                    return 'Successfully called setUserAttribute API on ' + name;
                }
                catch (e) {
                    return 'Failed to call SET setUserAttribute on ' + name + ' ' + e;
                }
            }
            else {
                return 'Can\'t call setUserAttribute on forwarder ' + name + ', not initialized';
            }
        }

        function removeUserAttribute(forwarder, key) {
            setUserAttribute(key, null);
        }

        function logPageView(data) {
            try {
                if (data.EventAttributes) {
                    Leanplum.track('Viewed ' + data.EventName, data.EventAttributes);
                }
                else {
                    Leanplum.track('Viewed ' + data.EventName);
                }
                return true;
            }
            catch (e) {
                return {error: e};
            }
        }

        function logPurchaseEvent(event) {
            var reportEvent = false;
            if (event.ProductAction.ProductList) {
                try {
                    event.ProductAction.ProductList.forEach(function(product) {
                        Leanplum.track('Purchase', parseFloat(product.TotalAmount), product);
                    });
                    return true;
                }
                catch (e) {
                    return {error: e};
                }
            }

            return reportEvent;
        }

        function logEvent(data) {
            try {
                if (data.EventAttributes) {
                    Leanplum.track(data.EventName, data.EventAttributes);
                }
                else {
                    Leanplum.track(data.EventName);
                }
                return true;
            }
            catch (e) {
                return {error: e};
            }
        }

        function initForwarder(settings, service, testMode, trackerId, userAttributes, userIdentities) {
            forwarderSettings = settings;
            reportingService = service;
            isTesting = testMode;

            try {
                if (!isTesting) {
                    var leanplumScript = document.createElement('script');
                    leanplumScript.type = 'text/javascript';
                    leanplumScript.async = true;
                    leanplumScript.src = 'https://www.leanplum.com/static/leanplum.js';
                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(leanplumScript);
                    leanplumScript.onload = function() {
                        completeLeanPlumInitialization(forwarderSettings, userIdentities);
                    };
                } else {
                    completeLeanPlumInitialization(forwarderSettings, userIdentities);
                }

                return 'Leanplum successfully loaded';
            }
            catch (e) {
                return ('Failed to initialize: ' + e);
            }
        }

        function completeLeanPlumInitialization(forwarderSettings, userIdentities) {
            setLeanPlumEnvironment(forwarderSettings);
            initializeUserId(userIdentities);
            isInitialized = true;
        }

        function setLeanPlumEnvironment(forwarderSettings) {
            if (window.mParticle.isDebug) {
                Leanplum.setAppIdForDevelopmentMode(forwarderSettings.appId, forwarderSettings.apiKey);
            } else {
                Leanplum.setAppIdForProductionMode(forwarderSettings.appId, forwarderSettings.apiKey);
            }
        }

        function initializeUserId(userIdentities) {
            var customerIdentity, emailIdentity;

            customerIdentity = userIdentities.filter(function(identity) {
                return (identity.Type === window.mParticle.IdentityType.CustomerId);
            })[0];

            emailIdentity = userIdentities.filter(function(identity) {
                return (identity.Type === window.mParticle.IdentityType.Email);
            })[0];

            if (customerIdentity) {
                Leanplum.start(customerIdentity.Identity);
            } else if (emailIdentity) {
                Leanplum.start(emailIdentity.Identity);
            } else {
                Leanplum.start();
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserIdentity = setUserIdentity;
        this.setUserAttribute = setUserAttribute;
        this.removeUserAttribute = removeUserAttribute;
    };

    if (!window || !window.mParticle || !window.mParticle.addForwarder) {
        return;
    }

    window.mParticle.addForwarder({
        name: name,
        constructor: constructor
    });

})(window);
