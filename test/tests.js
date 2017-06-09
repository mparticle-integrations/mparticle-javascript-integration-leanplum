/* eslint-disable no-undef*/

describe('Leanplum Forwarder', function () {
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            getName: function () {
                return 'blahblah';
            }
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10
        },
        IdentityType = {
            Other: 0,
            CustomerId: 1,
            Facebook: 2,
            Twitter: 3,
            Google: 4,
            Microsoft: 5,
            Yahoo: 6,
            Email: 7,
            Alias: 8,
            FacebookCustomAudienceId: 9,
            getName: function () {return 'CustomerID';}
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2
        },
        ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function () {
                this.id = null;
                this.event = null;
            };
        },
        reportService = new ReportingService(),

        MockLeanplum = function() {
            var self = this;

            this.trackCustomEventCalled = false;
            this.logPurchaseEventCalled = false;
            this.initializeCalled = false;

            this.trackCustomName = null;
            this.logPurchaseName = null;
            this.apiKey = null;
            this.appId = null;
            this.userId = null;
            this.userAttributes = {};

            this.eventProperties = [];
            this.purchaseEventProperties = [];

            this.setAppIdForDevelopmentMode = function(appId, apiKey) {
                self.initializeCalled = true;
                self.apiKey = apiKey;
                self.appId = appId;

                return true;
            };

            this.setAppIdForProductionMode = function(appId, apiKey) {
                self.initializeCalled = true;
                self.apiKey = apiKey;
                self.appId = appId;

                return true;
            };
            this.track = function (name, eventProperties){
                self.trackCustomEventCalled = true;
                self.trackCustomName = name;
                if (name === 'Purchase') {
                    self.totalAmount = eventProperties.totalAmount;
                    self.eventProperties.push(arguments[2]);
                } else {
                    self.eventProperties.push(eventProperties);
                }

                // Return true to indicate event should be reported
                return true;
            };

            this.start = function(id) {
                self.userId = id;
            };

            this.setUserId = function(id) {
                self.userId = id;
            };

            this.setUserAttributes = function(attributeDict) {
                for (var key in attributeDict) {
                    if (attributeDict[key] === null) {
                        delete self.userAttributes[key];
                    } else {
                        self.userAttributes[key] = attributeDict[key];
                    }
                }
            };
        };

    before(function () {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.PromotionType = PromotionActionType;
        mParticle.IdentityType = IdentityType;
    });

    beforeEach(function() {
        window.Leanplum = new MockLeanplum();
        mParticle.forwarder.init({
            apiKey: '123456',
            appId: 'abcde'
        }, reportService.cb, true, null, {
            gender: 'm'
        }, [{
            Identity: 'customerId',
            Type: IdentityType.CustomerId
        }, {
            Identity: 'email',
            Type: IdentityType.Email
        }, {
            Identity: 'facebook',
            Type: IdentityType.Facebook
        }], '1.1', 'My App');
    });

    it('should log event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventName: 'Test Event',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category'
            }
        });
        window.Leanplum.apiKey.should.equal('123456');
        window.Leanplum.appId.should.equal('abcde');
        window.Leanplum.eventProperties[0].category.should.equal('category');
        window.Leanplum.eventProperties[0].label.should.equal('label');
        window.Leanplum.eventProperties[0].value.should.equal(200);

        done();
    });

    it('should log page view', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'test name',
            EventAttributes: {
                attr1: 'test1',
                attr2: 'test2'
            }
        });

        window.Leanplum.trackCustomEventCalled.should.equal(true);
        window.Leanplum.trackCustomName.should.equal('Viewed test name');
        window.Leanplum.eventProperties[0].attr1.should.equal('test1');
        window.Leanplum.eventProperties[0].attr2.should.equal('test2');

        done();
    });

    it('should log commerce event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1
                    }
                ],
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null
            }
        });

        window.Leanplum.trackCustomEventCalled.should.equal(true);
        window.Leanplum.trackCustomName.should.equal('Purchase');

        window.Leanplum.eventProperties[0].Sku.should.equal('12345');
        window.Leanplum.eventProperties[0].Name.should.equal('iPhone 6');
        window.Leanplum.eventProperties[0].Category.should.equal('Phones');
        window.Leanplum.eventProperties[0].Brand.should.equal('iPhone');
        window.Leanplum.eventProperties[0].Variant.should.equal('6');
        window.Leanplum.eventProperties[0].Price.should.equal(400);
        window.Leanplum.eventProperties[0].TotalAmount.should.equal(400);
        window.Leanplum.eventProperties[0].CouponCode.should.equal('coupon-code');
        window.Leanplum.eventProperties[0].Quantity.should.equal(1);

        done();
    });

    it('it should set user identity if IdentityType = CustomerId', function(done) {
        mParticle.forwarder.setUserIdentity('123abc', IdentityType.CustomerId);

        window.Leanplum.userId.should.equal('123abc');

        done();
    });

    it('it should set userId of type customerId if user identities passed to it include types customerId and email', function(done) {
        window.Leanplum.userId.should.equal('customerId');

        done();
    });

    it('it should set userId of type email if only email is passed in user identities', function(done) {
        mParticle.forwarder.init({
            apiKey: '123456',
            appId: 'abcde'
        }, reportService.cb, true, null, {
            gender: 'm'
        }, [{
            Identity: 'email',
            Type: IdentityType.Email
        }, {
            Identity: 'facebook',
            Type: IdentityType.Facebook
        }], '1.1', 'My App');

        window.Leanplum.userId.should.equal('email');

        done();
    });

    it('it should set user attributes when directly called', function(done) {
        mParticle.forwarder.setUserAttribute('color', 'blue');
        window.Leanplum.userAttributes.color.should.equal('blue');

        done();
    });

    it('it should remove user attributes', function(done) {
        mParticle.forwarder.setUserAttribute('color', 'blue');
        window.Leanplum.userAttributes.color.should.equal('blue');

        mParticle.forwarder.removeUserAttribute(null, 'color');

        Object.keys(window.Leanplum.userAttributes).length.should.equal(0);

        done();
    });
});
