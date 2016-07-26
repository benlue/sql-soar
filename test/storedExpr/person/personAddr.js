exports.soar = {
    table: {
        name: 'GeoLoc AS gloc',
        join: [
            {table: 'PsnLoc AS pl', onWhat: 'gloc.geID=pl.geID'},
            {table: 'Person AS psn', onWhat: 'pl.psnID=psn.psnID'}
        ]
    },
    columns: [
        'psn.name', {'psn.addr': defaultAddr}, {'psn.addr address': defaultAddr}, 'latitude', 'longitude'
    ],
    filters: {
        'psn.dob': '>'
    }
};

function  defaultAddr(addr)  {
    return  addr || 'Unknown';
}