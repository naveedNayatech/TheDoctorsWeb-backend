class APIFEATURES {
    constructor(query, queryStr){
    this.query = query;
    this.queryStr = queryStr;
    }

    search() {
        const keyword = this.queryStr.keyword ? {
          email: {
              $regex: this.queryStr.keyword,
              $options: 'i' //means case insensitive
          }
        } : { }

        console.log(keyword);
        this.query = this.query.find({ ...keyword });
        return this;
    }

    pagination(resPerPage) {
           const currentPage = Number(this.queryStr.page) || 1;
            const skip = resPerPage * (currentPage - 1) ;

            this.query = this.query.limit(resPerPage).skip(skip);
            return this; 
    }
}

module.exports = APIFEATURES