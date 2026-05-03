"""
Custom pagination for EmPay.
Allows the frontend to override page_size via query parameter (capped at 500).
"""

from rest_framework.pagination import PageNumberPagination


class FlexiblePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500
