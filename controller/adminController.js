exports.getPatients = (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'List of all patients'
    })
}