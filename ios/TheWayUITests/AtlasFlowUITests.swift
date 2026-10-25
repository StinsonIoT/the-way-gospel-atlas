import XCTest

final class AtlasFlowUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testSearchOpensSceneAndDetails() throws {
        let app = XCUIApplication()
        app.launch()

        let searchButton = app.buttons["Search scenes and places"]
        XCTAssertTrue(searchButton.waitForExistence(timeout: 15))
        searchButton.tap()

        let searchField = app.searchFields.firstMatch
        XCTAssertTrue(searchField.waitForExistence(timeout: 10))
        searchField.tap()
        searchField.typeText("Zechariah")

        let sceneResult = app.buttons.matching(
            NSPredicate(format: "label CONTAINS %@", "Your prayer has been heard")
        ).firstMatch
        XCTAssertTrue(sceneResult.waitForExistence(timeout: 10))
        sceneResult.tap()

        let sceneTitle = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", "Your prayer has been heard")
        ).firstMatch
        XCTAssertTrue(sceneTitle.waitForExistence(timeout: 10))

        let passageButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS %@", "Luke 1:5")
        ).firstMatch
        XCTAssertTrue(passageButton.waitForExistence(timeout: 10))
        passageButton.tap()

        let offlineVerse = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", "In the time of Herod king of Judea")
        ).firstMatch
        XCTAssertTrue(offlineVerse.waitForExistence(timeout: 10))
        app.buttons["Done"].tap()

        let detailsButton = app.buttons["scene-details-zechariah"]
        XCTAssertTrue(detailsButton.waitForExistence(timeout: 10))
        detailsButton.tap()

        XCTAssertTrue(app.staticTexts["DAILY LIFE"].waitForExistence(timeout: 10))
    }
}
