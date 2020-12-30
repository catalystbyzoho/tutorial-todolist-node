
var express = require('express');
var app = express();
app.use(express.json()); // This supports the JSON encoded bodies
var catalyst = require('zcatalyst-sdk-node');

//The GET API gets data from the TodoItems table in the Data Store
app.get('/todo', function (req, res) {
	var catalystApp = catalyst.initialize(req);
	var data = [];
	getToDoListFromDataStore(catalystApp).then(
		notes => {
			var html = "";
			notes.forEach(element => {
				//Creates a HTML for the list of items retrieved from the Data Store
				html = html.concat('<li value="' + element.TodoItems.ROWID + '">' + element.TodoItems.Notes + '</li>');
			});
			res.send(html); //Sends the HTML data back to the client for rendering
		}
	).catch(err => {
		console.log(err);
		sendErrorResponse(res);
	})
});

//The POST API sends data to persist in the TodoItems table in the Data Store
app.post('/todo', function (req, res) {
	console.log(req.body);
	var catalystApp = catalyst.initialize(req);
	var datastore = catalystApp.datastore();
	var table = datastore.table('TodoItems');
	var notesVal = req.body.item;
	var rowData = {}
	rowData["Notes"] = notesVal;
	var insertPromise = table.insertRow(rowData);
	insertPromise.then((row) => {
		res.redirect(req.get('referer')); //Reloads the page again after a successful insert
	}).catch(err => {
		console.log(err);
		sendErrorResponse(res);
	});
});

//The DELETE API deletes the selected items from the Data Store
app.delete('/todo:item', function (req, res) {
	var id = req.params.item;
	var catalystApp = catalyst.initialize(req);
	let datastore = catalystApp.datastore();
	let table = datastore.table('TodoItems');
	let rowPromise = table.deleteRow(id);
	rowPromise.then((row) => {
		res.send(id);
	}).catch(err => {
		console.log(err);
		sendErrorResponse(res);
	});
});

//This function executes the ZCQL query to retrieve items from the Data Store
function getToDoListFromDataStore(catalystApp) {
	return new Promise((resolve, reject) => {
		// Queries the table in the Data Store
		catalystApp.zcql().executeZCQLQuery("Select * from TodoItems order by createdtime").then(queryResponse => {
			resolve(queryResponse);
		}).catch(err => {
			reject(err);
		})
	});
}

/**
 * Sends an error response
 * @param {*} res 
 */
function sendErrorResponse(res) {
	res.status(500);
	res.send({
		"error": "Internal server error occurred. Please try again in some time."
	});
}

module.exports = app;
