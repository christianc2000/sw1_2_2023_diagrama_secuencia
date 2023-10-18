const socket = io();
function init() {

    const $ = go.GraphObject.make;
    myDiagram =
        new go.Diagram("myDiagramDiv",
            {
                allowCopy: true,
                linkingTool: $(MessagingTool),
                "resizingTool.isGridSnapEnabled": true,
                draggingTool: $(MessageDraggingTool),
                "draggingTool.gridSnapCellSize": new go.Size(1, MessageSpacing / 4),
                "draggingTool.isGridSnapEnabled": true,
                "SelectionMoved": ensureLifelineHeights,
                "PartResized": ensureLifelineHeights,
                "undoManager.isEnabled": true
            });

    myDiagram.addDiagramListener("Modified", e => {
        const button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        const idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.slice(0, idx);
        }
    });

    myDiagram.groupTemplate =
        $(go.Group, "Vertical",
            {
                locationSpot: go.Spot.Bottom,
                locationObjectName: "HEADER",
                minLocation: new go.Point(0, 0),
                maxLocation: new go.Point(9999, 0),
                selectionObjectName: "HEADER"
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            //PARA COLOCAR LA CABEZERA DE LA LÍNEA DE VIDA
            $(go.Panel, "Auto",
                { name: "HEADER" },
                $(go.Shape, "Rectangle",
                    {
                        fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
                        stroke: null
                    }),

                $(go.TextBlock,
                    {
                        margin: 5,
                        font: "400 10pt Source Sans Pro, sans-serif",
                        editable: true
                    },
                    new go.Binding("text", "text")),
            ),
            // Texto debajo del rectángulo que no es editable
            $(go.TextBlock,
                {
                    margin: 5,
                    font: "400 10pt Source Sans Pro, sans-serif",
                    alignment: go.Spot.Bottom,
                    // Puedes establecer "editable" en false para evitar la edición del texto
                    editable: false,
                    // Asegúrate de ajustar la propiedad "text" en tus datos para que aparezca aquí

                },
                new go.Binding("text", "stereotype"),// Asegúrate de que "subtitle" contenga el texto deseado
            ),
            //PARA REPRESENTAR LA LÍNEA VERTICAL DE LA LÍNEA DE VIDA
            $(go.Shape,
                {
                    figure: "LineV",
                    fill: null,
                    stroke: "gray",
                    strokeDashArray: [3, 3],
                    width: 1,
                    alignment: go.Spot.Center,
                    portId: "",
                    fromLinkable: true,
                    fromLinkableDuplicates: true,
                    toLinkable: true,
                    toLinkableDuplicates: true,
                    cursor: "pointer"
                },
                new go.Binding("height", "duration", computeLifelineHeight))
        );

    myDiagram.nodeTemplate =
        $(go.Node,
            {
                locationSpot: go.Spot.Top,
                locationObjectName: "SHAPE",
                minLocation: new go.Point(NaN, LinePrefix - ActivityStart),
                maxLocation: new go.Point(NaN, 19999),
                selectionObjectName: "SHAPE",
                resizable: true,
                resizeObjectName: "SHAPE",
                resizeAdornmentTemplate:
                    $(go.Adornment, "Spot",
                        $(go.Placeholder),
                        $(go.Shape,
                            {
                                alignment: go.Spot.Bottom, cursor: "col-resize",
                                desiredSize: new go.Size(6, 6), fill: "yellow"
                            })
                    )
            },
            new go.Binding("location", "", computeActivityLocation).makeTwoWay(backComputeActivityLocation),
            $(go.Shape, "Rectangle",
                {
                    name: "SHAPE",
                    fill: "white", stroke: "black",
                    width: ActivityWidth,
                    minSize: new go.Size(ActivityWidth, computeActivityHeight(0.25))
                },
                new go.Binding("height", "duration", computeActivityHeight).makeTwoWay(backComputeActivityHeight))
        );
    myDiagram.linkTemplate =
        $(MessageLink,
            { selectionAdorned: true, curviness: 0 },
            $(go.Shape, "Rectangle",
                { stroke: "black" }),
            $(go.Shape,
                { toArrow: "OpenTriangle", stroke: "black" }),
            $(go.TextBlock,
                {
                    font: "400 9pt Source Sans Pro, sans-serif",
                    segmentIndex: 0,
                    segmentOffset: new go.Point(NaN, NaN),
                    isMultiline: false,
                    editable: true
                },
                new go.Binding("text", "text").makeTwoWay())
        );

    load();
    // create the Palette
    const initialModel = [
        { text: "actor", stereotype: "ACTOR", isGroup: true, duration: 9 },
        { text: "object", stereotype: "OBJECT", isGroup: true, duration: 9 },
        { text: "boundary", stereotype: "BOUNDARY", isGroup: true, duration: 9 },
        { text: "control", stereotype: "CONTROL", isGroup: true, duration: 9 },
        { text: "entity", stereotype: "ENTITY", isGroup: true, duration: 9 },
    ];

    const modelWithAutoKeys = initialModel.map((item, index) => {
        item.key = `Elem${index + 1}`;
        return item;
    });
    myPalette =
        new go.Palette("myPaletteDiv", {
            maxSelectionCount: 1,
            groupTemplate: myDiagram.groupTemplate,  // Comparte las plantillas utilizadas por myDiagram
            layout: $(go.GridLayout,  // Usamos un GridLayout para organizar los elementos en columnas
                {
                    alignment: go.GridLayout.Location,  // Alineamos los elementos en la parte superior de cada columna
                    wrappingColumn: 3,  // Especificamos 3 columnas
                    spacing: new go.Size(10, 10),  // Ajusta el espaciado entre los elementos
                }
            ),
            model: new go.GraphLinksModel(modelWithAutoKeys),
        });

    //
    myDiagram.addDiagramListener("TextEdited", function (e) {
        console.log(e.diagram);
        var editedGroup = e.diagram.selection.first(); // Obtiene el grupo que se editó
        if (editedGroup) {
            var editedData = editedGroup.data; // Obtiene los datos del grupo editado
            console.log("editedData: ", editedData);
            var newText = editedData.text; // Nuevo texto editado
            var owner = editedData.key; // Clave del grupo que representa al propietario

            // Emitir los datos editados a través del socket
            socket.emit('editGroupText:diagram', { text: newText, owner: owner });
        } else {
            console.log("no entra al editext");
        }
    });


    // Agregar un manejador de eventos para el evento ExternalObjectsDropped
    myDiagram.addDiagramListener("ExternalObjectsDropped", function (e) {
        const addedParts = e.diagram.selection.iterator;
        while (addedParts.next()) {
            const part = addedParts.value;
            // Realiza acciones con el elemento agregado, como obtener sus propiedades
            const key = part.data.key; // Obtener la clave del elemento
            console.log("key del emit.... ", key);
            console.log("emitiendo.... ", part.data);
            socket.emit('addnode:diagram', part.data);

        }
    });
    //Para ver cuando un elemento del diagrama se mueve
    myDiagram.addDiagramListener("SelectionMoved", function (e) {
        var selectedNodes = e.diagram.selection; // Obtén los nodos seleccionados

        // Itera a través de los nodos seleccionados
        selectedNodes.each(function (node) {
            var data = node.data;
            console.log("nodo moviendo.....", data);
            data.loc = go.Point.stringify(node.location);
            socket.emit('movenode:diagram', data);
        });
    });
    myDiagram.addDiagramListener("LinkDrawn", function (e) {
        var link = e.subject; // Obtiene el enlace creado
        // Puedes acceder a los datos del enlace utilizando link.data
        console.log("Nuevo enlace creado:", link.data);
        socket.emit('linknode:diagram', link.data);
    });


}

function ensureLifelineHeights(e) {
    const arr = myDiagram.model.nodeDataArray;
    let max = -1;
    for (let i = 0; i < arr.length; i++) {
        const act = arr[i];
        if (act.isGroup) continue;
        max = Math.max(max, act.start + act.duration);
    }
    if (max > 0) {
        for (let i = 0; i < arr.length; i++) {
            const gr = arr[i];
            if (!gr.isGroup) continue;
            if (max > gr.duration) {
                myDiagram.model.setDataProperty(gr, "duration", max);
            }
        }
    }
}

const LinePrefix = 20;
const LineSuffix = 30;
const MessageSpacing = 10;
const ActivityWidth = 10;
const ActivityStart = 5;
const ActivityEnd = 5;

function computeLifelineHeight(duration) {
    return LinePrefix + duration * MessageSpacing + LineSuffix;
}

function computeActivityLocation(act) {
    const groupdata = myDiagram.model.findNodeDataForKey(act.group);
    if (groupdata === null) return new go.Point();
    const grouploc = go.Point.parse(groupdata.loc);
    return new go.Point(grouploc.x, convertTimeToY(act.start) - ActivityStart);
}
function backComputeActivityLocation(loc, act) {
    myDiagram.model.setDataProperty(act, "start", convertYToTime(loc.y + ActivityStart));
}

function computeActivityHeight(duration) {
    return ActivityStart + duration * MessageSpacing + ActivityEnd;
}
function backComputeActivityHeight(height) {
    return (height - ActivityStart - ActivityEnd) / MessageSpacing;
}
function convertTimeToY(t) {
    return t * MessageSpacing + LinePrefix;
}
function convertYToTime(y) {
    return (y - LinePrefix) / MessageSpacing;
}
class MessageLink extends go.Link {
    constructor() {
        super();
        this.time = 0;
    }

    getLinkPoint(node, port, spot, from, ortho, othernode, otherport) {
        const p = port.getDocumentPoint(go.Spot.Center);
        const r = port.getDocumentBounds();
        const op = otherport.getDocumentPoint(go.Spot.Center);

        const data = this.data;
        const time = data !== null ? data.time : this.time;
        const aw = this.findActivityWidth(node, time);
        const x = (op.x > p.x ? p.x + aw / 2 : p.x - aw / 2);
        const y = convertTimeToY(time);
        return new go.Point(x, y);
    }

    findActivityWidth(node, time) {
        let aw = ActivityWidth;
        if (node instanceof go.Group) {
            if (!node.memberParts.any(mem => {
                const act = mem.data;
                return (act !== null && act.start <= time && time <= act.start + act.duration);
            })) {
                aw = 0;
            }
        }
        return aw;
    }

    getLinkDirection(node, port, linkpoint, spot, from, ortho, othernode, otherport) {
        const p = port.getDocumentPoint(go.Spot.Center);
        const op = otherport.getDocumentPoint(go.Spot.Center);
        const right = op.x > p.x;
        return right ? 0 : 180;
    }

    computePoints() {
        if (this.fromNode === this.toNode) {
            const data = this.data;
            const time = data !== null ? data.time : this.time;
            const p = this.fromNode.port.getDocumentPoint(go.Spot.Center);
            const aw = this.findActivityWidth(this.fromNode, time);

            const x = p.x + aw / 2;
            const y = convertTimeToY(time);
            this.clearPoints();
            this.addPoint(new go.Point(x, y));
            this.addPoint(new go.Point(x + 50, y));
            this.addPoint(new go.Point(x + 50, y + 5));
            this.addPoint(new go.Point(x, y + 5));
            return true;
        } else {
            return super.computePoints();
        }
    }
}
class MessagingTool extends go.LinkingTool {
    constructor() {
        super();
        const $ = go.GraphObject.make;
        this.temporaryLink =
            $(MessageLink,
                $(go.Shape, "Rectangle",
                    { stroke: "magenta", strokeWidth: 2 }),
                $(go.Shape,
                    { toArrow: "OpenTriangle", stroke: "magenta" }));
    }

    doActivate() {
        super.doActivate();
        const time = convertYToTime(this.diagram.firstInput.documentPoint.y);
        this.temporaryLink.time = Math.ceil(time);
    }

    insertLink(fromnode, fromport, tonode, toport) {
        const newlink = super.insertLink(fromnode, fromport, tonode, toport);
        if (newlink !== null) {
            const model = this.diagram.model;
            const start = this.temporaryLink.time;
            const duration = 1;
            newlink.data.time = start;
            model.setDataProperty(newlink.data, "text", "msg");
            const newact = {
                group: newlink.data.to,
                start: start,
                duration: duration
            };
            model.addNodeData(newact);
            ensureLifelineHeights();
        }
        return newlink;
    }
}
class MessageDraggingTool extends go.DraggingTool {
    computeEffectiveCollection(parts, options) {
        const result = super.computeEffectiveCollection(parts, options);
        result.add(new go.Node(), new go.DraggingInfo(new go.Point()));
        parts.each(part => {
            if (part instanceof go.Link) {
                result.add(part, new go.DraggingInfo(part.getPoint(0).copy()));
            }
        })
        return result;
    }
    mayMove() {
        return !this.diagram.isReadOnly && this.diagram.allowMove;
    }
    moveParts(parts, offset, check) {
        super.moveParts(parts, offset, check);
        const it = parts.iterator;
        while (it.next()) {
            if (it.key instanceof go.Link) {
                const link = it.key;
                const startY = it.value.point.y;
                let y = startY + offset.y;
                const cellY = this.gridSnapCellSize.height;
                y = Math.round(y / cellY) * cellY;
                const t = Math.max(0, convertYToTime(y));
                link.diagram.model.set(link.data, "time", t);
                link.invalidateRoute();
            }
        }
    }
}


function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    console.log(myDiagram.model.toJson());
    socket.emit('save:diagram', JSON.parse(myDiagram.model.toJson()));
    myDiagram.isModified = false;
}
function load() {
    //    myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);

}
// Escucha evento diagrama:new_nodo y actualiza en el mensaje en el DOM
socket.on('save:diagram', function (data) {
    // Itera a través de los datos recibidos del socket
    myDiagram.model = go.Model.fromJson(data);
});

socket.on('addnode:diagram', function (data) {
    // Itera a través de los datos recibidos del socket
    console.log("addnode: ", data);
    const myModel = myDiagram.model; // Obtén una referencia a tu modelo
    // Añade el nuevo nodo a tu modelo
    myModel.addNodeData(data);
});

socket.on('linknode:diagram', function (data) {
    // Itera a través de los datos recibidos del socket
    console.log("Recibiendo link node: ", data);

    // Obtén una referencia al modelo de tu diagrama
    var myModel = myDiagram.model;

    // Añade el nuevo enlace a tu modelo
    myModel.addLinkData(data);

    // Realiza un layout para que el diagrama se ajuste al nuevo enlace
    myDiagram.layoutDiagram(true);
});
socket.on('user_id', (data) => {
    const userId = data.id;
    const usuarioElement = document.getElementById('usuario');
    usuarioElement.innerHTML = `Usuario ID: ${userId}`;
});




window.addEventListener('DOMContentLoaded', init);