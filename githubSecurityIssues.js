const { Octokit } = require("@octokit/core");
const fs = require('fs')

const organization = 'Niche-538'
const auth = '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'

const octokit = new Octokit({
    auth: auth
})

async function getRepositories() {
        const repositories = await octokit.request('GET /orgs/{org}/repos', {
            org: organization,
        })
    const repos = []
    for (let i = 0; i < repositories.data.length; i++) {
           repos.push(repositories.data[i].name)
    }
    return repos
}

async function getData() {

    const repositories = await getRepositories();
    //console.log(repositories)

    const result= []

    for (let j = 0; j < repositories.length; j++) {
        let response
        try {
             response = await octokit.request('GET /repos/{owner}/{repo}/code-scanning/alerts', {
                owner: organization,
                repo: repositories[j]
            })
        }catch (err){
            continue
        }
        const data = response.data;

        for (let i = 0; i < data.length; i++) {
            let securityIssue = {
                repository: repositories[0],
                issue_url: data[i].url,
                security_level: data[i].rule.security_severity_level,
                message: data[i].most_recent_instance.message.text,
                location_path: data[i].most_recent_instance.location.path,
                location_start_line: data[i].most_recent_instance.location.start_line,
                location_end_line: data[i].most_recent_instance.location.end_line,
            }
            result.push(securityIssue)
        }
    }

    return result
}


getData().then(json => {

    let fields = Object.keys(json[0])
    let replacer = function(key, value) { return value === null ? '' : value }
    let csv = json.map(function(row){
        return fields.map(function(fieldName){
            return JSON.stringify(row[fieldName], replacer)
        }).join(',')
    })
    csv.unshift(fields.join(',')) // add header column
    csv = csv.join('\r\n');

    fs.writeFile('SecurityIssues.csv', csv, (err) => {
        if (err) throw err;
    })
})


