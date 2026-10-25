import MapLibre
import CoreLocation
import SwiftUI
import UIKit

struct AtlasMapView: UIViewRepresentable {
    let scene: AtlasScene
    let content: AtlasContent
    var interactive = false

    func makeUIView(context: Context) -> MLNMapView {
        let map = MLNMapView(frame: .zero, styleURL: Bundle.main.url(forResource: "AtlasStyle", withExtension: "json", subdirectory: "Resources"))
        map.delegate = context.coordinator
        map.showsLogoView = false
        map.showsAttributionButton = false
        map.isScrollEnabled = interactive
        map.isZoomEnabled = interactive
        map.isRotateEnabled = interactive
        map.isPitchEnabled = interactive
        return map
    }

    func updateUIView(_ map: MLNMapView, context: Context) {
        map.isScrollEnabled = interactive
        map.isZoomEnabled = interactive
        map.isRotateEnabled = interactive
        map.isPitchEnabled = interactive
        context.coordinator.scene = scene
        context.coordinator.content = content
        if context.coordinator.lastCameraSceneID != scene.id,
           let bounds = scene.view, bounds.count == 2, bounds.allSatisfy({ $0.count >= 2 }) {
            let west = min(bounds[0][0], bounds[1][0]), east = max(bounds[0][0], bounds[1][0])
            let south = min(bounds[0][1], bounds[1][1]), north = max(bounds[0][1], bounds[1][1])
            let center = CLLocationCoordinate2D(latitude: (south + north) / 2, longitude: (west + east) / 2)
            let span = max(max(east - west, north - south), 0.03)
            let zoom = min(12.5, max(2.8, log2(360 / span) - 1.1))
            map.setCenter(center, zoomLevel: zoom, animated: false)
            let camera = map.camera
            camera.pitch = CGFloat(scene.pitch > 0 ? scene.pitch : (scene.temple != 0 ? 55 : 0))
            camera.heading = scene.bearing
            map.setCamera(camera, withDuration: 0.9, animationTimingFunction: nil)
            context.coordinator.lastCameraSceneID = scene.id
        }
        if let style = map.style, context.coordinator.lastAppliedSceneID != scene.id {
            context.coordinator.apply(style)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(scene: scene, content: content) }

    final class Coordinator: NSObject, MLNMapViewDelegate {
        var scene: AtlasScene
        var content: AtlasContent
        var lastCameraSceneID: String?
        var lastAppliedSceneID: String?
        init(scene: AtlasScene, content: AtlasContent) { self.scene = scene; self.content = content }

        func mapView(_ mapView: MLNMapView, didFinishLoading style: MLNStyle) { apply(style) }

        func apply(_ style: MLNStyle) {
            let palette = content.palettes[scene.palette] ?? content.palettes["day"] ?? .fallback
            if let background = style.layer(withIdentifier: "background") as? MLNBackgroundStyleLayer {
                background.backgroundColor = NSExpression(forConstantValue: UIColor(hex: palette.sea))
            }
            addFill(named: "land-wide", color: palette.land, style: style)
            addFill(named: "land", color: palette.land, style: style)
            addFill(named: "lakes", color: palette.lake, style: style)
            addGeographicOverlays(style: style, palette: palette)
            addEmpireOverlay(style: style, palette: palette)
            addHistoricalModel(style: style, palette: palette)
            if style.source(withIdentifier: "rivers") == nil,
               let url = Bundle.main.url(forResource: "rivers", withExtension: "json", subdirectory: "Resources/data") {
                let source = MLNShapeSource(identifier: "rivers", url: url, options: nil)
                style.addSource(source)
                let layer = MLNLineStyleLayer(identifier: "rivers-line", source: source)
                layer.lineWidth = NSExpression(forConstantValue: 1.5)
                style.addLayer(layer)
            }
            if let riverLayer = style.layer(withIdentifier: "rivers-line") as? MLNLineStyleLayer {
                riverLayer.lineColor = NSExpression(forConstantValue: UIColor(hex: palette.river))
            }
            let routeIDs = Set(scene.show)
            let routeFeatures = content.routes.compactMap { route -> MLNPolylineFeature? in
                guard routeIDs.contains(route.id), route.coordinates.count > 1 else { return nil }
                var coordinates = route.coordinates.map { CLLocationCoordinate2D(latitude: $0[1], longitude: $0[0]) }
                let feature = MLNPolylineFeature(coordinates: &coordinates, count: UInt(coordinates.count))
                feature.attributes = ["kind": route.kind ?? "journey"]
                return feature
            }
            if let oldLayer = style.layer(withIdentifier: "story-routes-recorded") { style.removeLayer(oldLayer) }
            if let oldLayer = style.layer(withIdentifier: "story-routes-implied") { style.removeLayer(oldLayer) }
            if let old = style.source(withIdentifier: "story-routes") { style.removeSource(old) }
            let routeSource = MLNShapeSource(identifier: "story-routes", features: routeFeatures, options: nil)
            style.addSource(routeSource)
            let recordedRoutes = MLNLineStyleLayer(identifier: "story-routes-recorded", source: routeSource)
            recordedRoutes.predicate = NSPredicate(format: "kind == %@", "route")
            recordedRoutes.lineColor = NSExpression(forConstantValue: UIColor(hex: palette.accent))
            recordedRoutes.lineWidth = NSExpression(forConstantValue: 2.2)
            recordedRoutes.lineOpacity = NSExpression(forConstantValue: 0.9)
            style.addLayer(recordedRoutes)
            let impliedRoutes = MLNLineStyleLayer(identifier: "story-routes-implied", source: routeSource)
            impliedRoutes.predicate = NSPredicate(format: "kind == %@", "link")
            impliedRoutes.lineColor = NSExpression(forConstantValue: UIColor(hex: palette.muted))
            impliedRoutes.lineWidth = NSExpression(forConstantValue: 1.7)
            impliedRoutes.lineDashPattern = NSExpression(forConstantValue: [1, 2])
            style.addLayer(impliedRoutes)
            // Story places are labelled in the card and shown as native map symbols.
            let visible = Set(scene.show)
            let features = content.places.compactMap { place -> MLNPointFeature? in
                guard visible.contains(place.id), let lng = place.lng, let lat = place.lat else { return nil }
                let feature = MLNPointFeature(); feature.coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
                feature.attributes = ["label": place.label ?? place.id, "kind": place.type ?? "named"]
                return feature
            }
            if let oldLabels = style.layer(withIdentifier: "story-place-labels") { style.removeLayer(oldLabels) }
            if let oldCertain = style.layer(withIdentifier: "story-place-certain") { style.removeLayer(oldCertain) }
            if let oldUncertain = style.layer(withIdentifier: "story-place-uncertain") { style.removeLayer(oldUncertain) }
            if let old = style.source(withIdentifier: "story-places") { style.removeSource(old) }
            let source = MLNShapeSource(identifier: "story-places", features: features, options: nil)
            style.addSource(source)
            let certain = MLNCircleStyleLayer(identifier: "story-place-certain", source: source)
            certain.predicate = NSPredicate(format: "kind == %@", "named")
            certain.circleRadius = NSExpression(forConstantValue: 4)
            certain.circleColor = NSExpression(forConstantValue: UIColor(hex: palette.accent))
            certain.circleStrokeColor = NSExpression(forConstantValue: UIColor(hex: palette.sea))
            certain.circleStrokeWidth = NSExpression(forConstantValue: 1.5)
            style.addLayer(certain)
            let uncertain = MLNCircleStyleLayer(identifier: "story-place-uncertain", source: source)
            uncertain.predicate = NSPredicate(format: "kind IN %@", ["trad", "proposal", "star"])
            uncertain.circleRadius = NSExpression(forConstantValue: 4.5)
            uncertain.circleColor = NSExpression(forConstantValue: UIColor(hex: palette.sea))
            uncertain.circleStrokeColor = NSExpression(forConstantValue: UIColor(hex: palette.trad))
            uncertain.circleStrokeWidth = NSExpression(forConstantValue: 2)
            style.addLayer(uncertain)
            let labels = MLNSymbolStyleLayer(identifier: "story-place-labels", source: source)
            labels.text = NSExpression(forKeyPath: "label")
            labels.textFontSize = NSExpression(forConstantValue: 11)
            labels.textColor = NSExpression(forConstantValue: UIColor(hex: palette.txt))
            labels.textHaloColor = NSExpression(forConstantValue: UIColor(hex: palette.sea))
            labels.textHaloWidth = NSExpression(forConstantValue: 1.5)
            style.addLayer(labels)
            lastAppliedSceneID = scene.id
        }

        private func addFill(named name: String, color: String, style: MLNStyle) {
            let source: MLNShapeSource
            if let existing = style.source(withIdentifier: name) as? MLNShapeSource {
                source = existing
            } else {
                guard let url = Bundle.main.url(forResource: name, withExtension: "json", subdirectory: "Resources/data") else { return }
                source = MLNShapeSource(identifier: name, url: url, options: nil)
                style.addSource(source)
            }
            if let layer = style.layer(withIdentifier: "\(name)-fill") as? MLNFillStyleLayer {
                layer.fillColor = NSExpression(forConstantValue: UIColor(hex: color))
                layer.fillOpacity = NSExpression(forConstantValue: 0.92)
            } else {
                let layer = MLNFillStyleLayer(identifier: "\(name)-fill", source: source)
                layer.fillColor = NSExpression(forConstantValue: UIColor(hex: color))
                layer.fillOpacity = NSExpression(forConstantValue: 0.92)
                style.addLayer(layer)
            }
        }

        private func addHistoricalModel(style: MLNStyle, palette: AtlasPalette) {
            let sourceName: String?
            if scene.temple != 0 { sourceName = "jerusalem3d" }
            else if scene.village != 0 { sourceName = "capernaum3d" }
            else { sourceName = nil }

            for layerID in ["historical-model-extrusions"] {
                if let layer = style.layer(withIdentifier: layerID) { style.removeLayer(layer) }
            }
            for name in ["jerusalem3d", "capernaum3d"] {
                if name != sourceName, let source = style.source(withIdentifier: name) { style.removeSource(source) }
            }
            guard let sourceName else { return }
            let source: MLNShapeSource
            if let existing = style.source(withIdentifier: sourceName) as? MLNShapeSource { source = existing }
            else {
                guard let url = Bundle.main.url(forResource: sourceName, withExtension: "json", subdirectory: "Resources/data") else { return }
                source = MLNShapeSource(identifier: sourceName, url: url, options: nil)
                style.addSource(source)
            }
            let layer = MLNFillExtrusionStyleLayer(identifier: "historical-model-extrusions", source: source)
            layer.fillExtrusionBase = NSExpression(forKeyPath: "base")
            layer.fillExtrusionHeight = NSExpression(forKeyPath: "height")
            layer.fillExtrusionColor = NSExpression(forConstantValue: UIColor(hex: palette.accent))
            layer.fillExtrusionOpacity = NSExpression(forConstantValue: 0.9)
            style.addLayer(layer)
        }

        private func addGeographicOverlays(style: MLNStyle, palette: AtlasPalette) {
            let visible = Set(scene.show)
            let zoneFeatures = content.zones.compactMap { zone -> MLNPolygonFeature? in
                guard visible.contains(zone.id), zone.ring.count >= 4 else { return nil }
                var coordinates = zone.ring.map { CLLocationCoordinate2D(latitude: $0[1], longitude: $0[0]) }
                let feature = MLNPolygonFeature(coordinates: &coordinates, count: UInt(coordinates.count))
                feature.attributes = ["id": zone.id, "ruler": zone.ruler]
                return feature
            }
            addPolygonOverlay(identifier: "political-zones", features: zoneFeatures,
                              fill: palette.trad, line: palette.trad, fillOpacity: 0.06,
                              dashed: true, style: style)

            let areaFeatures = content.areas.compactMap { area -> MLNPolygonFeature? in
                guard visible.contains(area.id), area.ring.count >= 4 else { return nil }
                var coordinates = area.ring.map { CLLocationCoordinate2D(latitude: $0[1], longitude: $0[0]) }
                let feature = MLNPolygonFeature(coordinates: &coordinates, count: UInt(coordinates.count))
                feature.attributes = ["id": area.id]
                return feature
            }
            addPolygonOverlay(identifier: "story-areas", features: areaFeatures,
                              fill: palette.muted, line: palette.muted, fillOpacity: 0.045,
                              dashed: true, style: style)
        }

        private func addPolygonOverlay(identifier: String, features: [MLNPolygonFeature],
                                       fill: String, line: String, fillOpacity: Double,
                                       dashed: Bool, style: MLNStyle) {
            let fillID = "\(identifier)-fill"
            let lineID = "\(identifier)-line"
            if let layer = style.layer(withIdentifier: fillID) { style.removeLayer(layer) }
            if let layer = style.layer(withIdentifier: lineID) { style.removeLayer(layer) }
            if let source = style.source(withIdentifier: identifier) { style.removeSource(source) }
            guard !features.isEmpty else { return }
            let source = MLNShapeSource(identifier: identifier, features: features, options: nil)
            style.addSource(source)
            let fillLayer = MLNFillStyleLayer(identifier: fillID, source: source)
            fillLayer.fillColor = NSExpression(forConstantValue: UIColor(hex: fill))
            fillLayer.fillOpacity = NSExpression(forConstantValue: fillOpacity)
            style.addLayer(fillLayer)
            let lineLayer = MLNLineStyleLayer(identifier: lineID, source: source)
            lineLayer.lineColor = NSExpression(forConstantValue: UIColor(hex: line))
            lineLayer.lineWidth = NSExpression(forConstantValue: 1.1)
            if dashed { lineLayer.lineDashPattern = NSExpression(forConstantValue: [2, 1.5]) }
            style.addLayer(lineLayer)
        }

        private func addEmpireOverlay(style: MLNStyle, palette: AtlasPalette) {
            let sourceID = "roman-empire"
            let fillID = "roman-empire-fill"
            let lineID = "roman-empire-line"
            guard !scene.empire.isEmpty else {
                if let layer = style.layer(withIdentifier: fillID) { style.removeLayer(layer) }
                if let layer = style.layer(withIdentifier: lineID) { style.removeLayer(layer) }
                if let source = style.source(withIdentifier: sourceID) { style.removeSource(source) }
                return
            }
            let source: MLNShapeSource
            if let existing = style.source(withIdentifier: sourceID) as? MLNShapeSource { source = existing }
            else {
                guard let url = Bundle.main.url(forResource: "rome", withExtension: "json", subdirectory: "Resources/data") else { return }
                source = MLNShapeSource(identifier: sourceID, url: url, options: nil)
                style.addSource(source)
            }
            let fillLayer: MLNFillStyleLayer
            if let existing = style.layer(withIdentifier: fillID) as? MLNFillStyleLayer { fillLayer = existing }
            else {
                fillLayer = MLNFillStyleLayer(identifier: fillID, source: source)
                style.addLayer(fillLayer)
            }
            fillLayer.predicate = NSPredicate(format: "era == %@", scene.empire)
            fillLayer.fillColor = NSExpression(forConstantValue: UIColor(hex: palette.trad))
            fillLayer.fillOpacity = NSExpression(forConstantValue: 0.045)

            let lineLayer: MLNLineStyleLayer
            if let existing = style.layer(withIdentifier: lineID) as? MLNLineStyleLayer { lineLayer = existing }
            else {
                lineLayer = MLNLineStyleLayer(identifier: lineID, source: source)
                style.addLayer(lineLayer)
            }
            lineLayer.predicate = NSPredicate(format: "era == %@", scene.empire)
            lineLayer.lineColor = NSExpression(forConstantValue: UIColor(hex: palette.trad))
            lineLayer.lineWidth = NSExpression(forConstantValue: 1.1)
        }
    }
}

private extension UIColor {
    convenience init(hex: String) {
        let value = UInt64(hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted), radix: 16) ?? 0
        self.init(red: CGFloat((value >> 16) & 0xff) / 255, green: CGFloat((value >> 8) & 0xff) / 255,
                  blue: CGFloat(value & 0xff) / 255, alpha: 1)
    }
}
