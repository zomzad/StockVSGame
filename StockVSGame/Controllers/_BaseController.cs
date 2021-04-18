using System;
using System.Web.Mvc;

namespace StockVSGame.Controllers
{
    public class _BaseController : Controller
    {
        bool _isPostBack = false;
        public bool IsPostBack
        {
            get { return _isPostBack; }
        }

        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            base.OnActionExecuting(filterContext);

            bool isPost = string.Compare(Request.HttpMethod, "POST",
                              StringComparison.CurrentCultureIgnoreCase) == 0;
            if (string.IsNullOrWhiteSpace(Request.UrlReferrer?.ToString()))
            {
                isPost = false;
            }

            bool isCurrentUrl = string.Compare(filterContext.HttpContext.Request.Url.AbsoluteUri,
                                    filterContext.HttpContext.Request.UrlReferrer?.ToString(),
                                    StringComparison.CurrentCultureIgnoreCase) == 0;

            _isPostBack = isPost && isCurrentUrl;
        }
    }
}