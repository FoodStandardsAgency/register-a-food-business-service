jest.mock("express", () => ({
    Router: jest.fn(() => ({
        post: jest.fn(),
        get: jest.fn(),
        delete: jest.fn()
    }))
}));
jest.mock("./Tasks.controller", () => ({
    createNewRegistration: jest.fn((a, b, c, sendResponse) => {
        sendResponse();
    }),
    getRegistration: jest.fn(),
    deleteRegistration: jest.fn()
}));
jest.mock("../../services/statusEmitter.service");
const registrationController = require("./registration.controller");
const { registrationRouter } = require("./registration.router");
describe("registration router", () => {
    let router, send, handler, status;
    beforeEach(() => {
        send = jest.fn();
        status = jest.fn();
        router = registrationRouter();
    });

    afterEach(() => jest.clearAllMocks());

    describe("Get to /registersubmissions", () => {
        beforeEach(() => {
            handler = router.get.mock.calls[0][2];
        });

        describe("when making a valid request", () => {
            beforeEach(async () => {
                await handler({ params: { } }, { send });
            });

            it("should call res.send", () => {
                expect(send).toBeCalled();
            });

            it("should call registerSubmissionWithTascomiAction", () => {
                expect(registrationController.registerSubmissionWithTascomiAction).toBeCalled();
            });
        });
    });

    describe("Get to /sendnotifications", () => {
        beforeEach(() => {
            handler = router.get.mock.calls[0][2];
        });

        describe("when making a valid request", () => {
            beforeEach(async () => {
                await handler({ params: { } }, { send });
            });

            it("should call res.send", () => {
                expect(send).toBeCalled();
            });

            it("should call sendNotificationsAction", () => {
                expect(registrationController.sendNotificationsAction).toBeCalled();
            });
        });
    });
});

