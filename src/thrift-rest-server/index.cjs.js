const RESOURCE_CHUNK = /{([-a-zA-Z0-9_]{1,256})}/g;

function parsePSFPath(path) {
    const pathParts = [];
    const queryParts = [];

    const [pathPart, queryPart] = path.split('?');

    if (pathPart) {
        const resourceMatches = pathPart.match(RESOURCE_CHUNK);
        if (resourceMatches) {
        pathParts.push(
            ...resourceMatches.map(x => x.replace(RESOURCE_CHUNK, '$1')),
        );
        }
    }

    if (queryPart) {
        const parsedQuery = querystring.parse(queryPart);
        queryParts.push(
            ...Object.entries(parsedQuery).map(([key, value]) => [
                key,
                value.replace(RESOURCE_CHUNK, '$1'),
            ]),
        );
    }
    return {
        expressPath: pathPart.replace(RESOURCE_CHUNK, ':$1'),
        pathParts,
        queryPart,
    };
}

module.exports = function createRestServer(app, ServiceHandler, thriftClient) {
    Object.entries(ServiceHandler.methodAnnotations).forEach(([rpcMethod, { annotations }]) => {
        if (annotations.rest_path && thriftClient[rpcMethod]) {
            const { expressPath, pathParts } = parsePSFPath(annotations.rest_path);
            app[annotations.rest_verb](expressPath, (req, res) => {
                const args = {};
                pathParts.forEach((attrKey) => {
                    args[attrKey] = req.params[attrKey];
                });
                thriftClient[rpcMethod](args).then((result) => {
                    res.send(result);
                });
            });
        }
    });
};
