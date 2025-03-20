import "./SourceComponent.css"

function formatTitle(slug) {
    return slug
      .split('-') // Split by hyphen
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(' '); // Join words with space
}
    

function SourceComponent(props){
    const formatedTitle = formatTitle(props.source)

    return(
        <div className="SourceComponentContainer">
            <div className="SourceInfo">
                <img className="SourceImage" src={props.image} alt={formatedTitle} />
                <p className="SourceTitle">{formatedTitle}</p>
                <p>Subscribe</p>
            </div>

            
        </div>
    )
}

export default SourceComponent;