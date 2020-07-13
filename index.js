const config = require ('./config');
const importIssues = require ('./importIssues');
var convert = require ('xml-js');

const configValues = config ();

try {
  var xml = require ('fs').readFileSync (`./${configValues.fileName}`, 'utf8');
  var jsonData = convert.xml2json (xml, {compact: true, spaces: 4});
  require ('fs').writeFileSync ('jira.json', jsonData);

  importIssues (
    configValues.gitHubData,
    jsonData,
    configValues.jiraUserDetails,
    configValues.jiraUsernameMapping
  );
} catch (error) {
  console.log (
    'No such XML file was found at your root location. Try adding a file with a format "abc.xml"'
      .red
  );
}
